import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, or, where, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import LogCard from '../components/LogCard';
import { PenSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface StudyLog {
  id: string;
  authorId: string;
  folderId?: string;
  topicTitle: string;
  content: string;
  visibility: 'public' | 'private';
  createdAt: number;
  updatedAt: number;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
}

export default function Feed() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'me' | 'partner'>('all');
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const otherUserDoc = snapshot.docs.find(d => d.id !== user.uid && d.data().id !== user.uid);
      if (otherUserDoc) {
        setPartnerProfile(otherUserDoc.data() as UserProfile);
      } else {
        setPartnerProfile(null);
      }
    }, (error) => {
      console.error("Error fetching partner profile:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const logsRef = collection(db, 'logs');
    const q = query(
      logsRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyLog));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredLogs = logs.filter(log => {
    // Filter by visibility first
    const isVisible = log.visibility === 'public' || log.authorId === user?.uid || log.authorId === partnerProfile?.id;
    if (!isVisible) return false;

    // Then filter by tab
    if (filter === 'me') return log.authorId === user?.uid;
    if (filter === 'partner') return log.authorId !== user?.uid;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 pb-24 md:pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-serif tracking-tight text-slate-900">Timeline</h1>
          <Link
            to="/edit"
            className="md:hidden flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-black/10"
          >
            <PenSquare className="w-4 h-4" />
            New Log
          </Link>
        </div>

        {/* Status Bar */}
        <div className="glassmorphism p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-8">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Your Streak</span>
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                 <span className="text-sm font-medium text-slate-900">{profile?.streak || 0} Days</span>
               </div>
             </div>
             <div className="w-px h-8 bg-slate-100"></div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                 Partner Status {partnerProfile ? `(${partnerProfile.name})` : ''}
               </span>
               <div className="flex items-center gap-3">
                  {partnerProfile ? (
                    partnerProfile.lastLoginDate === new Date().toDateString() || partnerProfile.lastStudyDate === new Date().toDateString() ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-900">Active today ({partnerProfile.streak || 0}d streak)</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-sm font-medium text-slate-500">Inactive today</span>
                      </>
                    )
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                      <span className="text-sm font-medium text-slate-400">No partner</span>
                    </>
                  )}
               </div>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
          {(['all', 'me', 'partner'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? 'All Logs' : f === 'me' ? 'My Logs' : 'Partner Logs'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-12">
          {filteredLogs.map(log => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <BookOpenIcon className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-serif italic text-lg">No study logs found.</p>
          {filter === 'all' && (
            <Link to="/edit" className="text-slate-900 font-medium inline-block mt-2 hover:underline">
              Create your first log
            </Link>
          )}
        </div>
      )}
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
