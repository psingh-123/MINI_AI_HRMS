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

  const API_URL = window.location.origin.replace('5173', '5000');
  const SERVER_URL = API_URL;

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('receive-message', (data) => {
      if (selectedChat && data.chatId === selectedChat._id && data.message) {
        setMessages(prev => {
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
      if (socket) socket.emit('join-chat', selectedChat._id);
    }
  }, [selectedChat, socket]);

  useEffect(() => scrollToBottom(), [messages]);

  const fetchChats = async () => {
    try {
      const response = await API.get('/chat/');
      setChats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await API.get(`/chat/${chatId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error(error);
    }
  };

  const updateChatsList = () => fetchChats();
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await API.post('/chat/message', {
        chatId: selectedChat._id,
        content: newMessage
      });

      if (response.data?.message) {
        socket?.emit('send-message', {
          chatId: selectedChat._id,
          message: response.data.message
        });
        setMessages(prev => [...prev, response.data.message]);
      }

      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && selectedChat) {
      setIsTyping(true);
      socket.emit('typing', { chatId: selectedChat._id, userName: 'You' });
    }

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop-typing', { chatId: selectedChat._id, userName: 'You' });
      setIsTyping(false);
    }, 1000);
  };

  const getChatName = (chat) => {
    if (!chat) return 'Unknown';
<<<<<<< HEAD
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
=======
    if (chat.isGroupChat) return chat.groupName || 'Group';
>>>>>>> 453b2acfea5f9fb389bedf63bc4a790f25c1f2c2
    const currentUserId = localStorage.getItem('userId');
    const other = chat.participants?.find(p => p._id !== currentUserId);
    return other?.name || 'User';
  };

  const getChatImage = (chat) => {
<<<<<<< HEAD
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
=======
    const currentUserId = localStorage.getItem('userId');
    const other = chat?.participants?.find(p => p._id !== currentUserId);
    return other?.profileImage || 'https://via.placeholder.com/40';
>>>>>>> 453b2acfea5f9fb389bedf63bc4a790f25c1f2c2
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">

      {/* Sidebar */}
      <div className="w-80 bg-white/80 backdrop-blur-lg border-r shadow-lg flex flex-col">

        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {chats.map(chat => (
            <div
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center p-4 mx-2 my-1 rounded-xl cursor-pointer transition
              ${selectedChat?._id === chat._id 
                ? 'bg-blue-100 shadow scale-[1.02]' 
                : 'hover:bg-gray-100 hover:scale-[1.01]'}`}
            >
              <img src={getChatImage(chat)} className="w-12 h-12 rounded-full mr-3 shadow" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{getChatName(chat)}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">

        {selectedChat ? (
          <>
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">{getChatName(selectedChat)}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${(msg.sender?._id || msg.sender) === localStorage.getItem('userId')
                    ? 'justify-end'
                    : 'justify-start'}`}
                >
<<<<<<< HEAD
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
=======
                  <div
                    className={`px-4 py-3 max-w-md rounded-2xl shadow-sm
                    ${(msg.sender?._id || msg.sender) === localStorage.getItem('userId')
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white border rounded-bl-none'}`}
                  >
                    {msg.content}
>>>>>>> 453b2acfea5f9fb389bedf63bc4a790f25c1f2c2
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white/80 backdrop-blur-lg border-t p-4 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-5 py-3 rounded-full border focus:ring-2 focus:ring-blue-400"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="px-5 py-3 bg-blue-500 text-white rounded-full hover:scale-105 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat
          </div>
        )}

      </div>
<<<<<<< HEAD

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
=======
>>>>>>> 453b2acfea5f9fb389bedf63bc4a790f25c1f2c2
    </div>
  );
};

export default Chat;