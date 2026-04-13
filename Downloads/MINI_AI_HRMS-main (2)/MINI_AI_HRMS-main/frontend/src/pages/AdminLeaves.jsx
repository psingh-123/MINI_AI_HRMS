import { useState, useEffect } from "react";
import API from "../services/api";

export default function AdminLeaves() {
  const [policy, setPolicy] = useState({ default_CL: 10, default_SL: 5, default_PL: 15 });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policyRes, leavesRes] = await Promise.all([
        API.get("/leaves/policy"),
        API.get("/leaves/all")
      ]);
      setPolicy(policyRes.data);
      setLeaves(leavesRes.data);
    } catch (error) {
      console.error("Error fetching admin leave data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicySave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Updating policy will recalculate leave totals for ALL employees. Proceed?")) return;
    try {
      await API.post("/leaves/policy", policy);
      alert("Policy updated and balances backfilled.");
    } catch (error) {
      console.error(error);
      const status = error.response ? error.response.status : "Network Error";
      alert(`Error saving policy. Backend returned: ${status}. Please make sure you restarted the backend terminal!`);
    }
  };

  const handleUpdateStatus = async (id, status, currentStatus) => {
    if (status === "Rejected" && currentStatus === "Approved") {
      if (!window.confirm("This leave is already Approved. Rejecting it will refund the days to the employee. Proceed?")) return;
    }
    const hrRemarks = window.prompt("Optional: Enter remarks for this decision", "");
    if (hrRemarks === null) return; // cancelled

    try {
      await API.patch(`/leaves/${id}/status`, { status, hrRemarks });
      fetchData(); // refresh list
    } catch (error) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-sm text-gray-500">Configure global leave policies and review employee applications.</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1 h-fit">
            <h2 className="text-lg font-bold mb-4">Global Leave Policy</h2>
            <form onSubmit={handlePolicySave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Casual Leaves (CL)</label>
                <input type="number" required min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500" 
                  value={policy.default_CL} onChange={e => setPolicy({...policy, default_CL: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sick Leaves (SL)</label>
                <input type="number" required min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500" 
                  value={policy.default_SL} onChange={e => setPolicy({...policy, default_SL: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Privilege Leaves (PL)</label>
                <input type="number" required min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500" 
                  value={policy.default_PL} onChange={e => setPolicy({...policy, default_PL: Number(e.target.value)})} />
              </div>
              <button className="w-full bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-medium transition-colors">
                Save & Apply to All Employees
              </button>
            </form>
          </div>

          {/* Leaves List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Employee Leave Requests</h2>
            {leaves.length === 0 ? (
              <p className="text-gray-500">No leave requests found.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {leaves.map(req => (
                  <div key={req._id} className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{req.employeeId?.name || "Unknown"}</h4>
                        <p className="text-xs text-gray-500">{req.employeeId?.email} • {req.employeeId?.department}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700 bg-white p-3 rounded border">
                      <p><strong>Type:</strong> <span className="font-semibold text-indigo-700">{req.leaveType}</span></p>
                      <p><strong>Total Days:</strong> {req.totalDays}</p>
                      <p><strong>From:</strong> {new Date(req.fromDate).toLocaleDateString()}</p>
                      <p><strong>To:</strong> {new Date(req.toDate).toLocaleDateString()}</p>
                      {req.reason && <p className="col-span-2 mt-1"><strong>Reason:</strong> {req.reason}</p>}
                    </div>

                    {req.hrRemarks && (
                      <p className="mt-2 text-xs text-red-600 font-medium border-l-2 border-red-500 pl-2">HR Remarks: {req.hrRemarks}</p>
                    )}

                    <div className="mt-4 flex gap-2">
                      {req.status !== 'Approved' && (
                        <button onClick={() => handleUpdateStatus(req._id, "Approved", req.status)} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          Approve
                        </button>
                      )}
                      {req.status !== 'Rejected' && (
                        <button onClick={() => handleUpdateStatus(req._id, "Rejected", req.status)} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
