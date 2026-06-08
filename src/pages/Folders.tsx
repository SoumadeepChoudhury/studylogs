import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Folder as FolderIcon, Plus } from 'lucide-react';
import clsx from 'clsx';
import { StudyLog } from './Feed';
import LogCard from '../components/LogCard';

interface Folder {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}

export default function Folders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'folders'), where('ownerId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setFolders(snap.docs.map(d => ({id: d.id, ...d.data()} as Folder)));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !activeFolder) return;
    const q = query(
      collection(db, 'logs'), 
      where('authorId', '==', user.uid),
      where('folderId', '==', activeFolder)
    );
    getDocs(q).then(snap => {
      setLogs(snap.docs.map(d => ({id: d.id, ...d.data()} as StudyLog)));
    });
  }, [user, activeFolder]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName.trim()) return;
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'folders', id), {
      id,
      name: newFolderName.trim(),
      ownerId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setNewFolderName('');
    setIsCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 pb-32 flex flex-col md:flex-row gap-12">
      {/* Sidebar for Folders */}
      <div className="w-full md:w-64 shrink-0">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-serif tracking-tight text-slate-900">My Folders</h2>
           <button onClick={() => setIsCreating(!isCreating)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
             <Plus className="w-4 h-4" />
           </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateFolder} className="mb-4">
            <input 
               type="text" 
               autoFocus
               placeholder="Folder Name"
               value={newFolderName}
               onChange={e => setNewFolderName(e.target.value)}
               className="w-full bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
            />
          </form>
        )}

        <div className="space-y-1 content-start">
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={clsx(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                activeFolder === f.id ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <FolderIcon className="w-4 h-4" />
                <span>{f.name}</span>
              </div>
            </button>
          ))}
          {folders.length === 0 && !isCreating && (
            <div className="text-sm font-serif italic text-slate-400 py-4 px-2">No folders created yet.</div>
          )}
        </div>
      </div>

      {/* Folder Content */}
      <div className="flex-1 min-w-0">
        {activeFolder ? (
          <div>
            <h3 className="text-4xl font-serif mb-8 pb-6 border-b border-slate-100 text-slate-900">
              {folders.find(f => f.id === activeFolder)?.name}
            </h3>
            {logs.length > 0 ? (
               <div className="space-y-8">
                 {logs.map(log => <LogCard key={log.id} log={log} />)}
               </div>
            ) : (
               <div className="text-slate-400 text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
                 <FolderIcon className="w-8 h-8 mb-4 mx-auto text-slate-300" />
                 <p className="font-serif italic text-lg">No logs in this folder.</p>
               </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <FolderIcon className="w-10 h-10 mb-6 text-slate-300" />
            <p className="font-serif italic text-lg">Select a folder to view its contents</p>
          </div>
        )}
      </div>
    </div>
  );
}
