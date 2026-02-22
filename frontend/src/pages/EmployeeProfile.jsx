import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function EmployeeProfile() {
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/employee-auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err.response || err.message || err);
      setError(err.response?.data?.error || "Failed to load profile");
      if (err.response?.status === 401) {
        // token invalid or expired
        localStorage.removeItem("token");
        navigate("/employee-login");
      }
    }
  };

  if (!profile) {
    return <div className="p-6">{error ? <span className="text-red-600">{error}</span> : "Loading..."}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl mx-auto">
        
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>

          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
            <p className="text-sm text-gray-500">
              {profile.department}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Skills</h4>
            {profile.skills.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills added</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Wallet Address</h4>
            <p className="text-gray-700 break-all">
              {profile.walletAddress || "Not added"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Account Status</h4>
            <p
              className={`font-bold ${
                profile.isActive ? "text-green-600" : "text-red-600"
              }`}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Joined On</h4>
            <p>
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;