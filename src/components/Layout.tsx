import { NavLink, Outlet } from 'react-router-dom';
import { Home, FolderOpen, BarChart3, User, PenSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

export default function Layout() {
  const { profile } = useAuth();

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'My Folders', path: '/folders', icon: FolderOpen },
    { name: 'Statistics', path: '/stats', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen border-slate-200 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-100 hidden md:flex flex-col bg-white">
        <div className="px-6 py-8 flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-serif italic text-xl shadow-lg">S</div>
          <h1 className="text-2xl font-serif tracking-tight text-slate-900 font-medium">StudyLogs</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-100 text-black'
                    : 'text-slate-400 hover:text-black hover:bg-slate-50'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <NavLink
            to="/edit"
            className="flex items-center justify-center gap-2 bg-black hover:bg-slate-800 shadow-lg shadow-black/10 text-white px-4 py-3.5 rounded-full font-medium transition-all"
          >
            <PenSquare className="w-4 h-4" />
            New Log
          </NavLink>

          {profile && (
            <div className="mt-8 flex items-center gap-3 px-2">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-sm font-medium text-slate-800">
                  {profile.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-[#FDFDFC]">
        <Outlet />
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pb-4 pt-2 px-4 flex justify-around items-center z-50">
         {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center p-2 rounded-lg',
                  isActive
                    ? 'text-black'
                    : 'text-slate-400 hover:text-slate-600'
                )
              }
            >
              <item.icon className="w-6 h-6" />
            </NavLink>
          ))}
      </nav>
    </div>
  );
}

function BookOpenIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
