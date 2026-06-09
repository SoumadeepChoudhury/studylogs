import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Profile() {
  const { profile, logOut } = useAuth();

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-12 pb-32">
      <h1 className="text-4xl font-serif tracking-tight mb-12 text-slate-900">Profile</h1>
      
      <div className="bg-white border border-slate-100 p-12 rounded-[2rem] flex flex-col items-center text-center shadow-sm">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="w-28 h-28 rounded-full mb-6 ring-4 ring-slate-50" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-4xl text-slate-800 font-serif italic mb-6 ring-4 ring-slate-50">
            {profile?.name?.charAt(0)}
          </div>
        )}
        
        <h2 className="text-3xl font-serif text-slate-900 mb-2">{profile?.name}</h2>
        <p className="text-slate-500 font-serif italic mb-10">{profile?.email}</p>

        <div className="flex items-center gap-8 text-sm w-full pt-8 border-t border-slate-100 p-4">
           <div className="flex-1">
             <div className="font-serif text-3xl font-medium text-slate-900 mb-2">{profile?.streak || 0}</div>
             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Day Streak</div>
           </div>
           <div className="w-px h-12 bg-slate-100"></div>
           <div className="flex-1">
             <div className="font-serif text-3xl font-medium text-slate-900 mb-2">Since</div>
             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 p-1">{new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</div>
           </div>
        </div>
      </div>
      
      <div className="mt-8">
        <button 
          onClick={logOut}
          className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-600 font-medium py-4 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
