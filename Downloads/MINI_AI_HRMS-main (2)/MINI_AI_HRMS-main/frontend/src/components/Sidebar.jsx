import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

function Sidebar({ prefix = "/admin", isEmployee = false }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === `${prefix}${path}` || location.pathname === path;

  const linkClass = (path) => `
    relative flex items-center px-4 py-3 rounded-xl transition-all duration-200
    ${isActive(path) 
      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 font-medium' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
    }
  `;

  // Define links based on role
  const adminLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { path: '/employees', label: 'Employees', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { path: '/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { path: '/chat', label: 'Chat', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
    { path: '/reports', label: 'Reports', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { path: '/attendance', label: 'Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { path: '/meetings', label: 'Video Meetings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
  ];

  const employeeLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { path: '/chat', label: 'Team Chat', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
    { path: '/report-abuse', label: 'Report Issue', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    { path: '/meetings', label: 'Video Meetings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
  ];

  const links = isEmployee ? employeeLinks : adminLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-20"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-72 bg-white/80 backdrop-blur-sm border-r border-slate-100 
        shadow-sm transition-transform duration-300 ease-in-out
        ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        flex flex-col min-h-screen
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              
              {/* Brand Name */}
              <div>
                <h1 className="text-xl font-light text-slate-800">
                  Zenith HR
                </h1>
                <p className="text-xs font-medium text-indigo-600 -mt-1">
                  {isEmployee ? 'Employee' : 'HRMS'}
                </p>
              </div>
            </div>

            {/* Close Button (Mobile) */}
            <button
              onClick={() => setCollapsed(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={`${prefix}${link.path}`}
                className={linkClass(link.path)}
                onClick={() => setCollapsed(true)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${isActive(link.path) 
                    ? 'bg-white shadow-sm text-indigo-600' 
                    : 'text-slate-400'
                  }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {link.icon}
                  </svg>
                </div>
                <span className="text-sm font-medium ml-3">{link.label}</span>
                {isActive(link.path) && (
                  <div className="absolute right-3 w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-100"></div>

          {/* Quick Stats */}
          <div className="px-4 py-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              System Status
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-slate-600">All systems operational</span>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-xs font-medium text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Button (Mobile) */}
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 left-4 lg:hidden z-20 w-12 h-12 bg-indigo-600 
                 rounded-full shadow-lg flex items-center justify-center
                 hover:bg-indigo-700 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}

export default Sidebar;