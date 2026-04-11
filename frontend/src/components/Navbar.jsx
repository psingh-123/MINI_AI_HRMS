import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Lightweight JWT payload decoder (no external deps). Returns payload object or null.
  const decodeJwt = (t) => {
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1];
      // base64url -> base64
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      // pad
      const pad = payload.length % 4;
      if (pad) payload += '='.repeat(4 - pad);
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const decoded = decodeJwt(token);
        if (!decoded) {
          setLoading(false);
          return;
        }

        if (decoded.role === "employee") {
          const res = await API.get("/employee-auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } else if (decoded.role === "admin") {
          const res = await API.get("/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        // If token is invalid, clear it
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/employee-login");
  };

  // Get user's first name or fallback
  const getFirstName = () => {
    if (user?.name) {
      return user.name.split(' ')[0];
    }
    // Try to get from token if user not loaded yet
    const decoded = token ? decodeJwt(token) : null;
    return decoded?.name?.split(' ')[0] || "Admin";
  };

  // Get user's initial
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    const decoded = token ? decodeJwt(token) : null;
    return decoded?.name?.charAt(0)?.toUpperCase() || "A";
  };

  // Get user's email
  const getUserEmail = () => {
    if (user?.email) return user.email;
    const decoded = token ? decodeJwt(token) : null;
    return decoded?.email || "employee@company.com";
  };

  const firstName = getFirstName();
  const userInitial = getUserInitial();
  const userEmail = getUserEmail();

  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Welcome Message */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Indicator */}
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center lg:hidden">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-sm sm:text-base lg:text-lg font-light text-slate-600">
                Welcome back,
                <span className="ml-1.5 font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ADMIN
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Button */}
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-indigo-600 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-indigo-600 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
              >
                {/* Avatar with Status */}
                <div className="relative">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                                flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-sm sm:text-base font-medium text-white">
                      {userInitial}
                    </span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* User Info */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {/* {user?.name || Admin} */}
                    Admin
                  </p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span>Online</span>
                  </p>
                </div>

                {/* Chevron Icon */}
                <svg className={`w-4 h-4 text-slate-400 hidden md:block transition-transform duration-200 
                                ${showProfileMenu ? 'rotate-180' : ''}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-slideDown">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{user?.name || firstName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">admin@gmail.com</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/employee-profile");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 
                             hover:text-indigo-600 flex items-center space-x-3 transition-colors group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Your Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/employee-settings");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 
                             hover:text-indigo-600 flex items-center space-x-3 transition-colors group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 
                             flex items-center space-x-3 transition-colors group"
                  >
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;