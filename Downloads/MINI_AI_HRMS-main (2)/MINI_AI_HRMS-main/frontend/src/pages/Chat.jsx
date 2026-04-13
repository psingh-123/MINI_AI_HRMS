import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';
import { format } from 'date-fns';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Token is handled by the API service
  const API_URL = window.location.origin.replace('5173', '5000');
  const SERVER_URL = API_URL;

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('receive-message', (data) => {
      if (selectedChat && data.chatId === selectedChat._id && data.message) {
        setMessages(prev => {
          // Prevent duplicates from same event
          if (prev.find(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
      updateChatsList();
    });

    newSocket.on('user-typing', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.userName), data.userName]);
      }
    });

    newSocket.on('user-stop-typing', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setTypingUsers(prev => prev.filter(u => u !== data.userName));
      }
    });

    return () => newSocket.close();
  }, [selectedChat]);

  useEffect(() => {
    fetchChats();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      if (socket) {
        socket.emit('join-chat', selectedChat._id);
      }
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await API.get('/chat/');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await API.get(`/chat/${chatId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const updateChatsList = () => {
    fetchChats();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createOneOnOneChat = async (participantId) => {
    try {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'HR';
      
      const response = await API.post('/chat/one-on-one', { 
        participantId,
        isAdminChat: isAdmin 
      });
      setSelectedChat(response.data);
      setShowNewChatModal(false);
      fetchChats();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const createAdminChat = async () => {
    try {
      const myId = localStorage.getItem('userId');
      const response = await API.post('/chat/one-on-one', {
        participantId: myId,
        isAdminChat: true
      });
      setSelectedChat(response.data);
      fetchChats();
    } catch (error) {
      console.error('Error creating admin chat:', error);
    }
  };

  const createGroupChat = async () => {
    try {
      const response = await API.post('/chat/group', { name: groupName, participants: selectedParticipants });
      setSelectedChat(response.data);
      setShowGroupChatModal(false);
      setGroupName('');
      setSelectedParticipants([]);
      fetchChats();
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await API.post('/chat/message', { chatId: selectedChat._id, content: newMessage });
      if (response.data?.message) {
        if (socket) {
          socket.emit('send-message', {
            chatId: selectedChat._id,
            message: response.data.message
          });
        }
        setMessages(prev => [...prev, response.data.message]);
      }
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && selectedChat) {
      setIsTyping(true);
      socket.emit('typing', {
        chatId: selectedChat._id,
        userName: 'You' // In real app, get from user context
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat) {
        socket.emit('stop-typing', {
          chatId: selectedChat._id,
          userName: 'You'
        });
      }
      setIsTyping(false);
    }, 1000);
  };

  const getChatName = (chat) => {
    if (!chat) return 'Unknown';
    if (chat.isAdminChat) {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'HR') {
        return chat.participants?.[0]?.name || 'Unknown Employee';
      }
      return 'HR / Admin Support';
    }
    if (chat.isGroupChat) {
      return chat.groupName || 'Unnamed Group';
    }
    const currentUserId = localStorage.getItem('userId');
    const otherParticipant = chat.participants?.find(p => p._id !== currentUserId);
    return otherParticipant?.name || 'Unknown User';
  };

  const getChatImage = (chat) => {
    if (!chat) return 'https://via.placeholder.com/40';
    if (chat.isGroupChat) {
      return 'https://via.placeholder.com/40/4F46E5/FFFFFF?text=G';
    }
    if (chat.isAdminChat) {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'HR') {
        return chat.participants?.[0]?.profilePic 
          ? `${SERVER_URL}${chat.participants[0].profilePic}` 
          : 'https://via.placeholder.com/40';
      }
      return 'https://via.placeholder.com/40/EF4444/FFFFFF?text=HR'; // HR support icon
    }
    const currentUserId = localStorage.getItem('userId');
    const otherParticipant = chat.participants?.find(p => p._id !== currentUserId);
    return otherParticipant?.profilePic 
      ? `${SERVER_URL}${otherParticipant.profilePic}` 
      : 'https://via.placeholder.com/40';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowGroupChatModal(true)}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                title="Create Group Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              {(localStorage.getItem('userRole')?.toUpperCase() !== 'ADMIN' && localStorage.getItem('userRole')?.toUpperCase() !== 'HR') && (
                <button
                  onClick={createAdminChat}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  title="Contact HR / Admin"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                }`}
            >
              <img
                src={getChatImage(chat)}
                alt={getChatName(chat)}
                className="w-12 h-12 rounded-full mr-3"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{getChatName(chat)}</h3>
                  {chat.lastMessage?.timestamp && !isNaN(new Date(chat.lastMessage.timestamp)) && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(chat.lastMessage.timestamp), 'HH:mm')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center">
                <img
                  src={getChatImage(selectedChat)}
                  alt={getChatName(selectedChat)}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{getChatName(selectedChat)}</h3>
                  {typingUsers.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${(message.sender?._id || message.sender) === localStorage.getItem('userId') ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 ${(message.sender?._id || message.sender) === localStorage.getItem('userId') ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <img 
                      src={message.sender?.profilePic ? `${SERVER_URL}${message.sender.profilePic}` : 'https://via.placeholder.com/32'} 
                      alt="" 
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${(message.sender?._id || message.sender) === localStorage.getItem('userId')
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.timestamp && !isNaN(new Date(message.timestamp)) && (
                        <p className={`text-[10px] mt-1 font-medium uppercase tracking-tighter ${(message.sender?._id || message.sender) === localStorage.getItem('userId') ? 'text-blue-100 opacity-70' : 'text-gray-400'
                          }`}>
                          {format(new Date(message.timestamp), 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a chat to start messaging</h3>
              <p className="text-gray-500">Choose from your existing chats or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Start New Chat</h3>
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  onClick={() => createOneOnOneChat(employee._id)}
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <img
                    src={employee.profilePic ? `${SERVER_URL}${employee.profilePic}` : 'https://via.placeholder.com/40'}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                  />
                  <span className="font-medium text-gray-700">{employee.name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showGroupChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create Group Chat</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
            />
            <div className="max-h-48 overflow-y-auto mb-4">
              {employees.map((employee) => (
                <label key={employee._id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(employee._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants([...selectedParticipants, employee._id]);
                      } else {
                        setSelectedParticipants(selectedParticipants.filter(id => id !== employee._id));
                      }
                    }}
                    className="mr-3"
                  />
                  <img
                    src={employee.profilePic ? `${SERVER_URL}${employee.profilePic}` : 'https://via.placeholder.com/40'}
                    alt={employee.name}
                    className="w-8 h-8 rounded-full mr-2 border border-gray-100"
                  />
                  <span className="text-gray-700">{employee.name}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createGroupChat}
                disabled={!groupName || selectedParticipants.length < 2}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowGroupChatModal(false);
                  setGroupName('');
                  setSelectedParticipants([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
