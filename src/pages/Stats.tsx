import { useAuth, UserProfile } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StudyLog } from './Feed';
import { Calendar, Flame, Target, Trophy, Users, Zap } from 'lucide-react';

export default function Stats() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [partnerLogs, setPartnerLogs] = useState<StudyLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        // Fetch my logs
        const q = query(collection(db, 'logs'), where('authorId', '==', user.uid));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({id: d.id, ...d.data()} as StudyLog)));

        // Fetch partner profile & logs
        const partnerSnap = await getDocs(collection(db, 'users'));
        const otherUserDoc = partnerSnap.docs.find(d => d.id !== user.uid && d.data().id !== user.uid);
        if (otherUserDoc) {
          const pData = otherUserDoc.data() as UserProfile;
          setPartnerProfile(pData);
          
          const pLogsQ = query(collection(db, 'logs'), where('authorId', '==', pData.id));
          const pLogsSnap = await getDocs(pLogsQ);
          setPartnerLogs(pLogsSnap.docs.map(d => ({id: d.id, ...d.data()} as StudyLog)));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [user]);

  const calcStats = (userLogs: StudyLog[], userProfile: UserProfile | null | undefined) => {
    const totalLogs = userLogs.length;
    const publicLogs = userLogs.filter(l => l.visibility === 'public').length;
    const privateLogs = userLogs.filter(l => l.visibility === 'private').length;
    const thisMonthLogs = userLogs.filter(l => l.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000).length;
    
    const activityCounts = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      
      const count = userLogs.filter(l => {
        const logDate = new Date(l.createdAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === d.getTime();
      }).length;
      
      return { date: d, count };
    });

    return { 
      totalLogs, 
      publicLogs, 
      privateLogs, 
      thisMonthLogs, 
      activityCounts,
      streak: userProfile?.streak || 0,
      longestStreak: userProfile?.longestStreak || 0
    };
  };

  const getActivityIntensity = (count: number, isPartner: boolean) => {
    if (count === 0) return 'bg-slate-100';
    if (count < 2) return isPartner ? 'bg-indigo-300' : 'bg-emerald-300';
    return isPartner ? 'bg-indigo-500' : 'bg-emerald-500';
  };

  const myStats = calcStats(logs, profile);
  const pStats = partnerProfile ? calcStats(partnerLogs, partnerProfile) : null;

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-12 pb-32">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12">
        <h1 className="text-4xl font-serif tracking-tight text-slate-900">Statistics & Insights</h1>
        {partnerProfile && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mt-4 md:mt-0 shadow-sm border border-indigo-100">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Compete with {partnerProfile.name.split(' ')[0]}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
        {/* Your Stats */}
        <div className="bg-white/50 border border-emerald-100 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-[100px] -z-10"></div>
          
          <div className="flex items-center gap-4 mb-10">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="You" className="w-12 h-12 rounded-full ring-2 ring-emerald-500/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-serif text-xl border border-emerald-200">
                {profile?.name?.charAt(0) || 'Y'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-serif text-slate-900">You</h2>
              <p className="text-sm font-medium text-emerald-600">Keep up the momentum!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard icon={Flame} label="Current Streak" value={myStats.streak} color="text-amber-500" />
            <StatCard icon={Trophy} label="Longest Streak" value={myStats.longestStreak} color="text-amber-500" />
            <StatCard icon={Target} label="Total Logs" value={myStats.totalLogs} color="text-emerald-500" />
            <StatCard icon={Calendar} label="This Month" value={myStats.thisMonthLogs} color="text-emerald-500" />
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm mb-6">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-6">Activity Heatmap (Last 30 Days)</h3>
            <div className="flex flex-wrap gap-2 justify-start">
              {myStats.activityCounts.map((day, i) => (
                <div 
                  key={i} 
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${getActivityIntensity(day.count, false)} transiton-all hover:scale-110 cursor-pointer`} 
                  title={`${day.date.toLocaleDateString()}: ${day.count} logs`} 
                />
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-6">Visibility</h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="text-3xl font-serif mb-1 text-slate-900">{myStats.publicLogs}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Public</div>
              </div>
              <div className="w-px h-10 bg-slate-100"></div>
              <div className="flex-1">
                <div className="text-3xl font-serif mb-1 text-slate-900">{myStats.privateLogs}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Private</div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Stats */}
        {partnerProfile && pStats ? (
          <div className="bg-white/50 border border-indigo-100 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-bl-[100px] -z-10"></div>
            
            <div className="flex items-center gap-4 mb-10">
              {partnerProfile?.photoURL ? (
                <img src={partnerProfile.photoURL} alt={partnerProfile.name} className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-serif text-xl border border-indigo-200">
                  {partnerProfile?.name?.charAt(0) || 'P'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-serif text-slate-900">{partnerProfile.name}</h2>
                <p className="text-sm font-medium text-indigo-600">Don't let them beat you!</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard icon={Flame} label="Current Streak" value={pStats.streak} color="text-amber-500" />
              <StatCard icon={Trophy} label="Longest Streak" value={pStats.longestStreak} color="text-amber-500" />
              <StatCard icon={Target} label="Total Logs" value={pStats.totalLogs} color="text-indigo-500" />
              <StatCard icon={Calendar} label="This Month" value={pStats.thisMonthLogs} color="text-indigo-500" />
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm mb-6">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-6">Activity Heatmap (Last 30 Days)</h3>
              <div className="flex flex-wrap gap-2 justify-start">
                {pStats.activityCounts.map((day, i) => (
                  <div 
                    key={i} 
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${getActivityIntensity(day.count, true)} transiton-all hover:scale-110 cursor-pointer`} 
                    title={`${day.date.toLocaleDateString()}: ${day.count} logs`} 
                  />
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-6">Visibility</h3>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="text-3xl font-serif mb-1 text-slate-900">{pStats.publicLogs}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Public</div>
                </div>
                <div className="w-px h-10 bg-slate-100"></div>
                <div className="flex-1">
                  <div className="text-3xl font-serif mb-1 text-slate-900">{pStats.privateLogs}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Private</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/50 border border-slate-100 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 mb-2">No Partner Found</h3>
            <p className="text-slate-500 max-w-sm">When another user joins the application, their stats will appear here so you can push each other forward.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-serif text-slate-900 leading-none mb-1">{value}</div>
        <div className="text-[10px] font-semibold tracking-wide uppercase text-slate-400">{label}</div>
      </div>
    </div>
  );
}

