import { useState, useEffect } from "react";
import API from "../services/api";

export default function AdminPayroll() {
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState("structures"); // 'structures' | 'generate' | 'records'

  // Generate states
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, structRes, payRes] = await Promise.all([
        API.get("/employees"), // Use existing endpoint
        API.get("/payroll/structure"),
        API.get("/payroll/all")
      ]);
      setEmployees(empRes.data);
      setStructures(structRes.data);
      setPayrolls(payRes.data);
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStructure = async (employeeId, form) => {
    try {
      await API.post("/payroll/structure", { employeeId, ...form });
      alert("Saved structure");
      fetchData();
    } catch (error) {
      alert("Error saving");
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${genMonth}/${genYear}?`)) return;
    try {
      const res = await API.post("/payroll/generate", { month: genMonth, year: genYear });
      alert(res.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error generating payroll");
    }
  };

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Confirm payment?")) return;
    try {
      await API.patch(`/payroll/${id}/mark-paid`);
      fetchData();
    } catch (error) {
      alert("Error updating status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-sm text-gray-500">Configure salaries, run monthly calculations, and manage payouts.</p>
      </div>

      {loading ? (
        <p>Loading payroll system...</p>
      ) : (
        <div className="space-y-6">
          <div className="flex space-x-4 border-b">
            <button className={`py-2 px-4 font-medium transition-colors ${activeTab === 'structures' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} onClick={() => setActiveTab('structures')}>Salary Structures</button>
            <button className={`py-2 px-4 font-medium transition-colors ${activeTab === 'generate' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} onClick={() => setActiveTab('generate')}>Generate Payroll</button>
            <button className={`py-2 px-4 font-medium transition-colors ${activeTab === 'records' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} onClick={() => setActiveTab('records')}>Payroll Records</button>
          </div>

          {activeTab === 'structures' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 w-32">Basic (₹)</th>
                    <th className="py-3 px-4 w-32">HRA (₹)</th>
                    <th className="py-3 px-4 w-32">Allowances (₹)</th>
                    <th className="py-3 px-4 w-24">Tax %</th>
                    <th className="py-3 px-4 w-32">PF (₹)</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const struct = structures.find(s => s.employeeId?._id === emp._id) || { basic: 0, hra: 0, allowances: 0, taxPercent: 0, pf: 0 };
                    // Local state per row
                    return <StructureRow key={emp._id} employee={emp} initial={struct} onSave={handleSaveStructure} />
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-sm">
              <h2 className="text-lg font-bold mb-4">Run Monthly Payroll Engine</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Month</label>
                  <select className="w-full border p-2 rounded" value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Year</label>
                  <input type="number" className="w-full border p-2 rounded" value={genYear} onChange={e => setGenYear(Number(e.target.value))} />
                </div>
                <div className="bg-blue-50 text-blue-800 p-3 rounded text-xs font-medium border border-blue-100">
                  Engine will calculate: (Gross / 30) * PresentDays. LWP days will be deducted from net pay. Ensure attendance is complete!
                </div>
                <button onClick={handleGenerate} className="w-full bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-medium tracking-wide">
                  Execute Generation Algorithm
                </button>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Gross</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Salary</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.length === 0 ? <tr><td colSpan="7" className="p-4 text-center">No payrolls found.</td></tr> : payrolls.map(p => (
                    <tr key={p._id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{p.employeeId?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{p.employeeId?.department}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold">{p.month}/{p.year}</td>
                      <td className="py-3 px-4 text-xs space-y-0.5">
                        <p>P: {p.presentDays} / {p.workingDays}</p>
                        {p.LWP_days > 0 && <p className="text-red-500 font-bold">LWP: {p.LWP_days}</p>}
                      </td>
                      <td className="py-3 px-4">₹{p.grossSalary?.toFixed(0)}</td>
                      <td className="py-3 px-4 text-red-600">-₹{p.totalDeductions?.toFixed(0)}</td>
                      <td className="py-3 px-4 font-bold text-green-600 text-base">₹{p.netSalary?.toFixed(0)}</td>
                      <td className="py-3 px-4">
                        {p.status === "Paid" ? (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded font-semibold text-xs">Paid</span>
                        ) : (
                          <button onClick={() => handleMarkPaid(p._id)} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded font-semibold text-xs transition">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function StructureRow({ employee, initial, onSave }) {
  const [form, setForm] = useState({
    basic: initial.basic || 0,
    hra: initial.hra || 0,
    allowances: initial.allowances || 0,
    taxPercent: initial.taxPercent || 0,
    pf: initial.pf || 0,
  });

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4 font-medium">{employee.name}</td>
      <td className="py-3 px-4"><input type="number" min="0" className="w-full border rounded p-1" value={form.basic} onChange={e => setForm({...form, basic: Number(e.target.value)})} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className="w-full border rounded p-1" value={form.hra} onChange={e => setForm({...form, hra: Number(e.target.value)})} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className="w-full border rounded p-1" value={form.allowances} onChange={e => setForm({...form, allowances: Number(e.target.value)})} /></td>
      <td className="py-3 px-4"><input type="number" min="0" max="100" className="w-full border rounded p-1" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: Number(e.target.value)})} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className="w-full border rounded p-1" value={form.pf} onChange={e => setForm({...form, pf: Number(e.target.value)})} /></td>
      <td className="py-3 px-4">
        <button onClick={() => onSave(employee._id, form)} className="text-white bg-indigo-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-indigo-700">Save</button>
      </td>
    </tr>
  )
}
