import { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function EmployeeGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active selections
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeGroupTasks, setActiveGroupTasks] = useState([]);

  // Modals / Status
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);

  // Update Form
  const [updateForm, setUpdateForm] = useState({
    status: "",
    proofType: "none",
    proofContent: "",
  });

  const fileInputRef = useRef(null);

  // Retrieve userId fallback explicitly if needed
  const [currentUserId] = useState(() => {
    let uid = localStorage.getItem('userId');
    if (!uid) {
      const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          uid = payload.id || payload.userId;
        } catch (e) {}
      }
    }
    return uid || '';
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await API.get("/groups");
      setGroups(res.data);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await API.get(`/groups/${group._id}/tasks`);
      setActiveGroupTasks(res.data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateForm({ ...updateForm, proofContent: reader.result, proofType: "image" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/groups/task/${taskToUpdate._id}/status`, updateForm);
      setShowUpdateModal(false);
      fetchTasks(selectedGroup); // Refresh tasks
    } catch (error) {
      console.error("Update task error:", error);
      const msg = error.response?.data?.message || "Error updating task. The file size might be too large or you lack permissions.";
      alert(msg);
    }
  };

  const openUpdateModal = (task) => {
    setTaskToUpdate(task);
    setUpdateForm({
      status: task.status === "Pending" ? "In Progress" : task.status,
      proofType: task.proofType || "none",
      proofContent: task.proofContent || "",
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Group Projects</h1>
        <p className="text-sm text-gray-500">Collaborative tasks and milestones.</p>
      </div>

      {loading ? (
        <p>Loading your projects...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Groups List */}
          <div className="lg:col-span-1 space-y-4">
            {groups.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
                You are not assigned to any group projects currently.
              </div>
            ) : (
              groups.map((group) => {
                const isLeader = group.leaderId?._id === currentUserId || group.leaderId === currentUserId;
                return (
                  <div 
                    key={group._id} 
                    className={`p-5 rounded-xl border cursor-pointer transition-all relative overflow-hidden
                      ${selectedGroup?._id === group._id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'}`}
                    onClick={() => fetchTasks(group)}
                  >
                    {isLeader && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        GROUP LEADER
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 pr-16">{group.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{group.description}</p>
                    <div className="mt-4 pt-3 border-t border-purple-100 flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Deadline: {new Date(group.deadline).toLocaleDateString()}</span>
                      <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">
                        {group.members.length} Members
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Group Details & Tasks */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 object-cover min-h-[500px]">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                  <p className="text-sm mt-3 font-medium text-gray-700">Team Leader: <span className="text-indigo-600">{selectedGroup.leaderId?.name || "N/A"}</span></p>
                </div>

                <h3 className="font-bold text-gray-900 mb-4">Assigned Tasks</h3>

                {activeGroupTasks.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                    Your team does not have any tasks assigned yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeGroupTasks.map(task => {
                      const isLeader = selectedGroup.leaderId?._id === currentUserId || selectedGroup.leaderId === currentUserId;
                      
                      return (
                        <div key={task._id} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{task.title}</h4>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border
                              ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                task.status === 'Submitted' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                              {task.status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">{task.description}</p>

                          {task.deadline && (
                            <p className="text-xs font-semibold text-gray-500 mb-4">
                              Due: {new Date(task.deadline).toLocaleDateString()}
                            </p>
                          )}

                          {task.hrFeedback && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-md">
                              <p className="text-xs font-bold text-red-700 mb-1">HR Review Feedback:</p>
                              <p className="text-sm text-red-600">{task.hrFeedback}</p>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            {isLeader ? (
                              <button
                                onClick={() => openUpdateModal(task)}
                                disabled={task.status === "Completed"}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                  task.status === "Completed" 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                                }`}
                              >
                                {task.status === "Completed" ? "Task Completed" : "Update Status & Proof"}
                              </button>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Only the Group Leader can submit proof for this task.</p>
                            )}

                            {task.proofType !== 'none' && task.proofContent && (
                              <span className="text-xs text-green-600 font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Proof Attached
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center flex flex-col justify-center items-center h-full">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Project Selected</h3>
                <p className="text-gray-500 max-w-sm">Select a project from the sidebar to view its tasks and manage team submissions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leader Update Modal */}
      {showUpdateModal && taskToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-indigo-600 border-b border-indigo-700">
              <h2 className="text-xl font-bold text-white">Update Task Status</h2>
              <p className="text-indigo-200 text-sm">{taskToUpdate.title}</p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="updateTaskForm" onSubmit={handleUpdateTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Task Status</label>
                  <select 
                    required 
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.status} 
                    onChange={e => setUpdateForm({...updateForm, status: e.target.value})}
                  >
                    <option value="Pending" disabled>Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted (Send to HR for review)</option>
                  </select>
                </div>

                {updateForm.status === "Submitted" && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Proof of Completion</h4>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Format</label>
                      <select 
                        required 
                        className="w-full border border-gray-300 p-2 rounded-lg"
                        value={updateForm.proofType} 
                        onChange={e => setUpdateForm({ ...updateForm, proofType: e.target.value, proofContent: "" })}
                      >
                        <option value="none">No proof required</option>
                        <option value="url">URL / Link</option>
                        <option value="text">Text Remarks</option>
                        <option value="image">Upload Image</option>
                      </select>
                    </div>

                    {updateForm.proofType === "url" && (
                      <div>
                        <input type="url" required placeholder="https://example.com/document" className="w-full border p-2 rounded-lg"
                          value={updateForm.proofContent} onChange={e => setUpdateForm({...updateForm, proofContent: e.target.value})} />
                      </div>
                    )}

                    {updateForm.proofType === "text" && (
                      <div>
                        <textarea required placeholder="Explain completion details..." className="w-full border p-2 rounded-lg" rows="3"
                          value={updateForm.proofContent} onChange={e => setUpdateForm({...updateForm, proofContent: e.target.value})} />
                      </div>
                    )}

                    {updateForm.proofType === "image" && (
                      <div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="w-full border border-dashed border-gray-300 p-4 rounded-lg bg-white" 
                        />
                        {updateForm.proofContent && (
                          <div className="mt-3 relative">
                            <img src={updateForm.proofContent} alt="Preview" className="h-32 object-contain rounded border border-gray-200" />
                            <button type="button" onClick={() => { setUpdateForm({...updateForm, proofContent: ""}); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600">×</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 mt-auto">
              <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancel</button>
              <button type="submit" form="updateTaskForm" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">Update Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
