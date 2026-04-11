import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { format, addHours, addMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [employees, setEmployees] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    participants: [],
    meetingType: 'scheduled',
    privacy: 'private',
    password: '',
    settings: {
      allowRecording: false,
      allowScreenShare: true,
      allowChat: true,
      allowRaiseHand: true,
      maxParticipants: 50,
      joinBeforeHost: false
    }
  });

  // Token and API_URL are handled by the API service
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchEmployees();
    fetchMeetings();
  }, [activeTab, currentPage]);

  const checkAdminStatus = () => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const endpoint = isAdmin ? '/meetings/all' : '/meetings/my-meetings';
      const statusFilter = activeTab === 'upcoming' ? 'scheduled' : 
                         activeTab === 'active' ? 'started' : 'ended';
      
      const response = await API.get(`${endpoint}?status=${statusFilter}&page=${currentPage}`);
      
      setMeetings(response.data.meetings);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const createMeeting = async () => {
    try {
      await API.post('/meetings', formData);
      
      setShowCreateModal(false);
      resetFormData();
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const startMeeting = async (meetingId) => {
    try {
      await API.post(`/meetings/${meetingId}/start`, {});
      const prefix = isAdmin ? '/admin' : '/employee';
      navigate(`${prefix}/meeting-room/${meetingId}`);
    } catch (error) {
      console.error('Error starting meeting:', error);
    }
  };

  const joinMeeting = async (meeting) => {
    try {
      const response = await API.post(`/meetings/${meeting._id}/join`, 
        { password: meeting.password }
      );

      if (response.data.canJoin) {
        const prefix = isAdmin ? '/admin' : '/employee';
        navigate(`${prefix}/meeting-room/${meeting._id}`);
      } else {
        alert(response.data.message || 'Cannot join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      alert(error.response?.data?.message || 'Failed to join meeting');
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await API.delete(`/meetings/${meetingId}`);
      
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      scheduledStartTime: '',
      scheduledEndTime: '',
      participants: [],
      meetingType: 'scheduled',
      privacy: 'private',
      password: '',
      settings: {
        allowRecording: false,
        allowScreenShare: true,
        allowChat: true,
        allowRaiseHand: true,
        maxParticipants: 50,
        joinBeforeHost: false
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'started': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrivacyColor = (privacy) => {
    switch (privacy) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-yellow-100 text-yellow-800';
      case 'password_protected': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isMeetingActive = (meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.scheduledStartTime);
    const endTime = new Date(meeting.scheduledEndTime);
    return meeting.status === 'started' || (now >= startTime && now <= endTime);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Video Meetings</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Schedule Meeting
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Completed
              </button>
            </nav>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrivacyColor(meeting.privacy)}`}>
                      {meeting.privacy.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{format(new Date(meeting.scheduledStartTime), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{meeting.participants.length + 1} participants</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Host: {meeting.host?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {meeting.status === 'scheduled' && meeting.host._id === localStorage.getItem('userId') && (
                    <button
                      onClick={() => startMeeting(meeting._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Start Meeting
                    </button>
                  )}
                  
                  {meeting.status === 'started' && (
                    <button
                      onClick={() => joinMeeting(meeting)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Join Meeting
                    </button>
                  )}
                  
                  {meeting.status === 'scheduled' && isMeetingActive(meeting) && (
                    <button
                      onClick={() => joinMeeting(meeting)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Join Now
                    </button>
                  )}
                  
                  {meeting.host._id === localStorage.getItem('userId') && (
                    <button
                      onClick={() => deleteMeeting(meeting._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Schedule New Meeting</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter meeting title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter meeting description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledStartTime}
                      onChange={(e) => setFormData({...formData, scheduledStartTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledEndTime}
                      onChange={(e) => setFormData({...formData, scheduledEndTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participants
                  </label>
                  <select
                    multiple
                    value={formData.participants}
                    onChange={(e) => setFormData({...formData, participants: Array.from(e.target.selectedOptions, option => option.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    size={4}
                  >
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple participants</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Privacy
                    </label>
                    <select
                      value={formData.privacy}
                      onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="password_protected">Password Protected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (if protected)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Settings
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowScreenShare}
                        onChange={(e) => setFormData({
                          ...formData, 
                          settings: {...formData.settings, allowScreenShare: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">Allow screen sharing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowChat}
                        onChange={(e) => setFormData({
                          ...formData, 
                          settings: {...formData.settings, allowChat: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">Allow chat</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowRaiseHand}
                        onChange={(e) => setFormData({
                          ...formData, 
                          settings: {...formData.settings, allowRaiseHand: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">Allow raise hand</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.settings.joinBeforeHost}
                        onChange={(e) => setFormData({
                          ...formData, 
                          settings: {...formData.settings, joinBeforeHost: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">Allow participants to join before host</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={createMeeting}
                  disabled={!formData.title || !formData.scheduledStartTime || !formData.scheduledEndTime}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Schedule Meeting
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetFormData();
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
    </div>
  );
};

export default Meetings;
