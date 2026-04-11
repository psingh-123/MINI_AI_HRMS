import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { format } from 'date-fns';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [reportsAgainstMe, setReportsAgainstMe] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    reportedUserId: '',
    reason: '',
    description: '',
    severity: 'medium',
    anonymous: false
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    reviewNotes: '',
    resolution: ''
  });

  // Deleted hardcoded token and API_URL as they are handled by the API service

  useEffect(() => {
    checkAdminStatus();
    fetchEmployees();
    if (isAdmin) {
      fetchAllReports();
      fetchStats();
    }
    fetchMyReports();
    fetchReportsAgainstMe();
  }, [isAdmin]);

  const checkAdminStatus = () => {
    const userRole = localStorage.getItem('userRole')?.toUpperCase();
    setIsAdmin(userRole === 'ADMIN' || userRole === 'HR');
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAllReports = async () => {
    try {
      const response = await API.get('/reports/all');
      console.log("fetchAllReports: response.data ->", response.data);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchMyReports = async () => {
    try {
      const response = await API.get('/reports/my-reports');
      console.log("fetchMyReports: response.data ->", response.data);
      setMyReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching my reports:', error);
    }
  };

  const fetchReportsAgainstMe = async () => {
    try {
      const response = await API.get('/reports/against-me');
      setReportsAgainstMe(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports against me:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/reports/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createReport = async () => {
    try {
      await API.post('/reports', formData);

      setShowCreateModal(false);
      setFormData({
        reportedUserId: '',
        reason: '',
        description: '',
        severity: 'medium',
        anonymous: false
      });
      fetchMyReports();
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const updateReportStatus = async (reportId) => {
    try {
      await API.patch(`/reports/${reportId}/status`, updateData);

      setShowViewModal(false);
      fetchAllReports();
      fetchStats();
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const displayReports = activeTab === 'all' ? reports :
    activeTab === 'my-reports' ? myReports :
      reportsAgainstMe;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            File New Report
          </button>
        </div>

        {/* Diagnostic info */}
        <div className="mb-4 text-xs text-gray-400">
          Admin: {isAdmin ? 'Yes' : 'No'} |
          Tab: {activeTab} |
          Count: {displayReports.length}
        </div>

        {/* Stats Cards */}
        {isAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Reports</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.statusStats.reduce((acc, stat) => acc + stat.count, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.statusStats.find(s => s._id === 'pending')?.count || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Under Review</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.statusStats.find(s => s._id === 'under_review')?.count || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.statusStats.find(s => s._id === 'resolved')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  All Reports
                </button>
              )}
              <button
                onClick={() => setActiveTab('my-reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my-reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                My Reports
              </button>
              <button
                onClick={() => setActiveTab('against-me')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'against-me'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Reports Against Me
              </button>
            </nav>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'my-reports' ? 'Reported User' : 'Reported By'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.createdAt && !isNaN(new Date(report.createdAt)) ? format(new Date(report.createdAt), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {activeTab === 'my-reports' ?
                          (report.anonymous ? 'Anonymous' : (report.reportedUser?.name || 'Unknown User')) :
                          (report.anonymous ? 'Anonymous' : (report.reportedBy?.name || 'Unknown User'))
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{report.reason}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">File New Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Against
                  </label>
                  <select
                    value={formData.reportedUserId}
                    onChange={(e) => setFormData({ ...formData, reportedUserId: e.target.value })}
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
                    Reason
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Reason</option>
                    <option value="misconduct">Misconduct</option>
                    <option value="harassment">Harassment</option>
                    <option value="performance">Performance Issues</option>
                    <option value="attendance">Attendance Issues</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Provide detailed description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">File anonymously</label>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={createReport}
                  disabled={!formData.reportedUserId || !formData.reason || !formData.description}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Report Modal */}
        {showViewModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Report Details</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">
                      {selectedReport.createdAt && !isNaN(new Date(selectedReport.createdAt)) ? format(new Date(selectedReport.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reported By</label>
                  <p className="text-sm text-gray-900">
                    {selectedReport.anonymous ? 'Anonymous' : selectedReport.reportedBy?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reported User</label>
                  <p className="text-sm text-gray-900">{selectedReport.reportedUser?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedReport.reason}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedReport.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(selectedReport.severity)}`}>
                    {selectedReport.severity}
                  </span>
                </div>

                {isAdmin && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Admin Actions</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Status
                        </label>
                        <select
                          value={updateData.status}
                          onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Status</option>
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Review Notes
                        </label>
                        <textarea
                          value={updateData.reviewNotes}
                          onChange={(e) => setUpdateData({ ...updateData, reviewNotes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Add review notes..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resolution
                        </label>
                        <textarea
                          value={updateData.resolution}
                          onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Describe resolution..."
                        />
                      </div>

                      <button
                        onClick={() => updateReportStatus(selectedReport._id)}
                        disabled={!updateData.status}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        Update Report
                      </button>
                      <br/>
                      <button
                        onClick={() => window.location.href = '/chat'}
                        className="w-full px-4 py-2 mt-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                      >
                        Go to Chat to Discuss
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.reviewedBy && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Review Information</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Reviewed by:</strong> {selectedReport.reviewedBy?.name}
                    </p>
                    {selectedReport.reviewNotes && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Notes:</strong> {selectedReport.reviewNotes}
                      </p>
                    )}
                    {selectedReport.resolution && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Resolution:</strong> {selectedReport.resolution}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
