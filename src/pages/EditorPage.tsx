import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { MonacoCodeBlockExtension } from '../extensions/MonacoCodeBlockExtension';
import { Globe, Lock, Save, X, Folder as FolderIcon } from 'lucide-react';
import clsx from 'clsx';

interface Folder {
  id: string;
  name: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
];

export default function EditorPage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [folderId, setFolderId] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!id);

  useEffect(() => {
    if (!user) return;
    const fetchFolders = async () => {
      const q = query(collection(db, 'folders'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      setFolders(snap.docs.map(d => ({id: d.id, name: d.data().name})));
    };
    fetchFolders();
  }, [user]);

  const tiptapEditor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      MonacoCodeBlockExtension,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate min-h-[400px] max-w-none focus:outline-none placeholder:text-slate-300 font-serif text-lg leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (!user || !id || !tiptapEditor) return;
    const loadLog = async () => {
      const docRef = doc(db, 'logs', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.topicTitle || '');
        setVisibility(data.visibility || 'public');
        setFolderId(data.folderId || '');
        tiptapEditor.commands.setContent(data.content || '');
      }
      setIsLoaded(true);
    };
    loadLog();
  }, [id, user, tiptapEditor]);

  const handleSave = async () => {
    if (!user || !title.trim() || isSaving) return;
    
    if (!tiptapEditor || tiptapEditor.isEmpty) return;
    const contentToSave = tiptapEditor.getHTML();

    setIsSaving(true);
    
    try {
      const logId = id || crypto.randomUUID();
      const newLog = {
        id: logId,
        authorId: user.uid,
        topicTitle: title.trim(),
        content: contentToSave,
        visibility,
        updatedAt: Date.now(),
        ...(folderId ? { folderId } : {})
      };

      if (!id) {
        Object.assign(newLog, {
          createdAt: Date.now(),
          reactionCounts: {},
          commentCount: 0,
        });
      }

      await setDoc(doc(db, 'logs', logId), newLog, { merge: true });

      if (!id && profile) {
        const today = new Date().toDateString();
        if (profile.lastStudyDate !== today) {
          let newStreak = profile.streak || 0;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (profile.lastStudyDate === yesterday.toDateString()) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          await updateProfile({ streak: newStreak, lastStudyDate: today });
        }
      }

      navigate(`/log/${logId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save log.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = isSaving || !title.trim() || !isLoaded || !tiptapEditor || tiptapEditor.isEmpty;

  if (!tiptapEditor) return null;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col h-screen">
      {/* Topbar */}
      <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 bg-white/80 backdrop-blur-md z-10 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2 outline-none focus:border-slate-400 shadow-sm transition-colors"
          >
            <option value="">No Folder</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1 flex hidden md:flex">
             <button
                onClick={() => setVisibility('public')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', 
                  visibility === 'public' ? 'bg-white text-slate-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600')}
             >
                <Globe className="w-4 h-4" /> Public
             </button>
             <button
                onClick={() => setVisibility('private')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', 
                  visibility === 'private' ? 'bg-white text-indigo-500 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600')}
             >
                <Lock className="w-4 h-4" /> Private
             </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="flex items-center gap-2 bg-black hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-black/5"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-6 py-12 md:px-16 flex flex-col">
        {!isLoaded ? (
          <div className="flex-1 flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4">
              <input 
                type="text"
                placeholder="Log Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-5xl md:text-6xl font-serif font-medium bg-transparent outline-none border-none text-slate-900 placeholder-slate-300 tracking-tight"
              />
            </div>

            <div className="mb-8 flex flex-wrap gap-2 text-sm border-b border-slate-100 pb-4 shrink-0">
               <button onClick={() => tiptapEditor.chain().focus().toggleBold().run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('bold') && "text-slate-900 bg-slate-200")}>Bold</button>
               <button onClick={() => tiptapEditor.chain().focus().toggleItalic().run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('italic') && "text-slate-900 bg-slate-200")}>Italic</button>
               <button onClick={() => tiptapEditor.chain().focus().toggleHeading({ level: 2 }).run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('heading', { level: 2 }) && "text-slate-900 bg-slate-200")}>H2</button>
               <button onClick={() => tiptapEditor.chain().focus().toggleBulletList().run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('bulletList') && "text-slate-900 bg-slate-200")}>Bullet List</button>
               <button onClick={() => tiptapEditor.chain().focus().setMonacoCodeBlock().run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('monacoCodeBlock') && "text-slate-900 bg-slate-200")}>Code</button>
               <button onClick={() => tiptapEditor.chain().focus().toggleHighlight().run()} className={clsx("p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors", tiptapEditor.isActive('highlight') && "text-slate-900 bg-slate-200")}>Highlight</button>
            </div>
            <EditorContent editor={tiptapEditor} className="pb-32 font-serif flex-1" />
          </>
        )}
      </div>
    </div>
  );
}
