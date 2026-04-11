import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { format } from 'date-fns';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');
  const [calculateData, setCalculateData] = useState({
    period: 'monthly',
    startDate: '',
    endDate: ''
  });

  // Token and API_URL are handled by the API service

  useEffect(() => {
    checkAdminStatus();
    fetchLeaderboard();
    fetchMyPosition();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [period]);

  const checkAdminStatus = () => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await API.get(`/leaderboard?period=${period}`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchMyPosition = async () => {
    try {
      const response = await API.get(`/leaderboard/my-position?period=${period}`);
      setMyPosition(response.data.myEntry);
      setTopPerformers(response.data.topPerformers);
    } catch (error) {
      console.error('Error fetching my position:', error);
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

  const calculateLeaderboard = async () => {
    try {
      await API.post('/leaderboard/calculate', calculateData);
      
      setShowCalculateModal(false);
      setCalculateData({
        period: 'monthly',
        startDate: '',
        endDate: ''
      });
      fetchLeaderboard();
      fetchMyPosition();
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
    }
  };

  const awardReward = async () => {
    try {
      const data = {
        employeeId: selectedEmployee,
        type: rewardType,
        description: rewardDescription,
        points: parseInt(rewardPoints)
      };

      await API.post('/leaderboard/award-reward', data);

      setShowRewardModal(false);
      setSelectedEmployee('');
      setRewardType('');
      setRewardDescription('');
      setRewardPoints('');
      fetchLeaderboard();
      fetchMyPosition();
    } catch (error) {
      console.error('Error awarding reward:', error);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Performance Leaderboard</h1>
          <div className="flex space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowCalculateModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Calculate Scores
                </button>
                <button
                  onClick={() => setShowRewardModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Award Reward
                </button>
              </>
            )}
          </div>
        </div>

        {/* My Position Card */}
        {myPosition && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${getRankBadge(myPosition.metrics.rank)}`}>
                  <span className="text-2xl font-bold">{getRankIcon(myPosition.metrics.rank)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Current Rank</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{myPosition.metrics.totalScore}</div>
                <p className="text-sm text-gray-500 mt-2">Total Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{myPosition.metrics.attendanceScore}</div>
                <p className="text-sm text-gray-500 mt-2">Attendance Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{myPosition.metrics.taskCompletionScore}</div>
                <p className="text-sm text-gray-500 mt-2">Task Score</p>
              </div>
            </div>

            {/* Achievements */}
            {myPosition.achievements && myPosition.achievements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {myPosition.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      {achievement.type.replace('_', ' ').toUpperCase()} (+{achievement.points} pts)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards */}
            {myPosition.rewards && myPosition.rewards.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Rewards</h3>
                <div className="space-y-2">
                  {myPosition.rewards.map((reward, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-purple-900">{reward.description}</p>
                        <p className="text-sm text-purple-700">{format(new Date(reward.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                        +{reward.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Performers */}
        {topPerformers && topPerformers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.slice(0, 3).map((performer) => (
                <div key={performer._id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadge(performer.metrics.rank)}`}>
                    <span className="text-lg font-bold">{getRankIcon(performer.metrics.rank)}</span>
                  </div>
                  <img
                    src={performer.employee?.profileImage || 'https://via.placeholder.com/60'}
                    alt={performer.employee?.name}
                    className="w-16 h-16 rounded-full mx-auto mt-3 mb-2"
                  />
                  <h3 className="font-medium text-gray-900">{performer.employee?.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{performer.metrics.totalScore} pts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {period.charAt(0).toUpperCase() + period.slice(1)} Leaderboard
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <tr 
                    key={entry._id}
                    className={myPosition && entry.employee._id === myPosition.employee._id ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${getRankBadge(entry.metrics.rank)}`}>
                        <span className="font-bold">{getRankIcon(entry.metrics.rank)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={entry.employee?.profileImage || 'https://via.placeholder.com/40'}
                          alt={entry.employee?.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.employee?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.employee?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-blue-600">{entry.metrics.totalScore}</div>
                      {entry.metrics.previousRank > 0 && entry.metrics.rank < entry.metrics.previousRank && (
                        <span className="text-xs text-green-600">↑ {entry.metrics.previousRank - entry.metrics.rank}</span>
                      )}
                      {entry.metrics.previousRank > 0 && entry.metrics.rank > entry.metrics.previousRank && (
                        <span className="text-xs text-red-600">↓ {entry.metrics.rank - entry.metrics.previousRank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.metrics.attendanceScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.metrics.taskCompletionScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.breakdown.presentDays}/{entry.breakdown.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.breakdown.completedTasks}/{entry.breakdown.totalTasks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculate Modal */}
        {showCalculateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Calculate Leaderboard Scores</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={calculateData.period}
                    onChange={(e) => setCalculateData({...calculateData, period: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={calculateData.startDate}
                    onChange={(e) => setCalculateData({...calculateData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={calculateData.endDate}
                    onChange={(e) => setCalculateData({...calculateData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={calculateLeaderboard}
                  disabled={!calculateData.startDate || !calculateData.endDate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  Calculate
                </button>
                <button
                  onClick={() => setShowCalculateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reward Modal */}
        {showRewardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Award Reward</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Type
                  </label>
                  <input
                    type="text"
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    placeholder="e.g., Employee of the Month"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={rewardDescription}
                    onChange={(e) => setRewardDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the achievement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(e.target.value)}
                    placeholder="Enter points"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={awardReward}
                  disabled={!selectedEmployee || !rewardType || !rewardDescription || !rewardPoints}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                >
                  Award Reward
                </button>
                <button
                  onClick={() => setShowRewardModal(false)}
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

export default Leaderboard;
