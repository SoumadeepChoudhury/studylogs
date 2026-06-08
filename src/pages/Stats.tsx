import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StudyLog } from './Feed';
import { Calendar, Flame, Target, Trophy } from 'lucide-react';

export default function Stats() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<StudyLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const q = query(collection(db, 'logs'), where('authorId', '==', user.uid));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({id: d.id, ...d.data()} as StudyLog)));
    };
    fetchStats();
  }, [user]);

  const totalLogs = logs.length;
  const publicLogs = logs.filter(l => l.visibility === 'public').length;
  const privateLogs = logs.filter(l => l.visibility === 'private').length;

  const activityCounts = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    
    // Count logs for this specific day
    const count = logs.filter(l => {
      const logDate = new Date(l.createdAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === d.getTime();
    }).length;
    
    return { date: d, count };
  });

  const getActivityIntensity = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count < 2) return 'bg-emerald-300';
    return 'bg-emerald-500';
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 pb-32">
      <h1 className="text-4xl font-serif tracking-tight mb-12 text-slate-900">Statistics & Insights</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <StatCard icon={Flame} label="Current Streak" value={profile?.streak || 0} color="text-amber-500" />
        <StatCard icon={Trophy} label="Longest Streak" value={profile?.longestStreak || 0} color="text-amber-500" />
        <StatCard icon={Target} label="Total Logs" value={totalLogs} color="text-emerald-500" />
        <StatCard icon={Calendar} label="This Month" value={logs.filter(l => l.createdAt > Date.now() - 30*24*60*60*1000).length} color="text-indigo-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-8">Visibility Breakdown</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="text-4xl font-serif mb-2 text-slate-900">{publicLogs}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public Logs</div>
            </div>
            <div className="w-px h-16 bg-slate-100"></div>
            <div className="flex-1">
              <div className="text-4xl font-serif mb-2 text-slate-900">{privateLogs}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Private Logs</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
           <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-8">Activity Heatmap (Last 30 Days)</h3>
           <div className="flex flex-wrap gap-2 justify-start">
             {activityCounts.map((day, i) => (
               <div 
                 key={i} 
                 className={`w-5 h-5 rounded-md ${getActivityIntensity(day.count)}`} 
                 title={`${day.date.toLocaleDateString()}: ${day.count} logs`} 
               />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center">
      <Icon className={`w-8 h-8 mb-4 ${color}`} />
      <div className="text-3xl font-serif text-slate-900 mb-2">{value}</div>
      <div className="text-xs font-semibold tracking-wide uppercase text-slate-400">{label}</div>
    </div>
  );
}
