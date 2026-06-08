import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, onSnapshot, query, orderBy, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit2, Globe, Lock, Send, Trash2, Code } from 'lucide-react';
import { StudyLog } from './Feed';
import Editor from '@monaco-editor/react';
import clsx from 'clsx';

interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function CommentItem({ comment }: { comment: Comment }) {
  const [authorName, setAuthorName] = useState('Loading...');
  const [authorPhoto, setAuthorPhoto] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchAuthor = async () => {
      const userSnap = await getDoc(doc(db, 'users', comment.authorId));
      if (userSnap.exists() && isMounted) {
        setAuthorName(userSnap.data().name);
        setAuthorPhoto(userSnap.data().photoURL);
      } else if (isMounted) {
        setAuthorName('Unknown');
      }
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [comment.authorId]);

  return (
    <div className="flex gap-4">
      {authorPhoto ? (
        <img src={authorPhoto} alt="" className="w-10 h-10 rounded-full border border-slate-200 shrink-0 object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
          {authorName.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-5 text-slate-800 border border-slate-100">
          {comment.content}
        </div>
        <div className="flex items-center gap-2 mt-3 ml-2">
          <span className="text-xs font-semibold text-slate-700">{authorName}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LogView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [log, setLog] = useState<StudyLog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('Loading...');
  const [authorPhoto, setAuthorPhoto] = useState('');
  const [loading, setLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    
    // Fetch Log
    const fetchLog = async () => {
      const docRef = doc(db, 'logs', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as StudyLog;
        setLog(data);
        
        // Fetch Author
        const userSnap = await getDoc(doc(db, 'users', data.authorId));
        if (userSnap.exists()) {
          setAuthorName(userSnap.data().name);
          setAuthorPhoto(userSnap.data().photoURL);
        } else {
          setAuthorName('Unknown');
        }
      }
      setLoading(false);
    };

    fetchLog();

    // Listen to comments
    const q = query(collection(db, 'logs', id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });

    return () => unsubscribe();
  }, [id, user]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !id) return;
    
    const commentId = crypto.randomUUID();
    const commentRef = doc(db, 'logs', id, 'comments', commentId);
    
    await setDoc(commentRef, {
      id: commentId,
      authorId: user.uid,
      content: newComment.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    await updateDoc(doc(db, 'logs', id), {
      commentCount: increment(1)
    });

    setNewComment('');
  };

  const handleDeleteLog = async () => {
    if (!id || !log || log.authorId !== user?.uid) return;
    try {
      await deleteDoc(doc(db, 'logs', id));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete log: ' + err.message);
    }
  };

  const handleReaction = async (type: string) => {
    if (!id || !log) return;
    const logRef = doc(db, 'logs', id);
    await updateDoc(logRef, {
      [`reactionCounts.${type}`]: increment(1)
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!log) return <div className="p-8">Log not found or you don't have permission to view it.</div>;

  const isAuthor = user?.uid === log.authorId;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:px-12 pb-32 bg-white min-h-screen border-x border-slate-100">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-12 transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </button>

      <article className="prose prose-slate prose-p:my-6 prose-headings:font-serif max-w-none">
        <div className="mb-12 border-b border-slate-100 pb-10">
           <div className="flex items-center justify-between mb-8">
             <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 tracking-wide uppercase">
               <div className="flex items-center gap-3">
                 {authorPhoto ? (
                    <img src={authorPhoto} alt="" className="w-7 h-7 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                 ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {authorName.charAt(0)}
                    </div>
                 )}
                 <span className="text-slate-700">{authorName}</span>
               </div>
               <span className="text-slate-300">•</span>
               <span>{formatDistanceToNow(log.createdAt, { addSuffix: true })}</span>
               <span className="text-slate-300">•</span>
               {log.visibility === 'public' ? (
                 <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded tracking-tighter">
                   Public
                 </span>
               ) : (
                 <span className="bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded tracking-tighter">
                   Private
                 </span>
               )}
             </div>

             {isAuthor && (
               <div className="flex items-center gap-2 relative">
                  <button onClick={() => navigate(`/edit/${log.id}`)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                      <span className="text-xs font-medium text-rose-600">Delete?</span>
                      <button onClick={handleDeleteLog} className="text-xs font-bold text-rose-700 hover:text-rose-900 px-2 py-1 bg-rose-200/50 rounded transition-colors">Yes</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-200/50 rounded transition-colors">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
               </div>
             )}
           </div>
           
           <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-slate-900 m-0 leading-tight">
             {log.topicTitle}
           </h1>
        </div>

        <div className="text-slate-800 leading-relaxed font-serif text-lg break-words" dangerouslySetInnerHTML={{ __html: log.content }} />
      </article>

      <div className="flex items-center gap-4 mt-8 pt-8 border-t border-slate-100">
        <button onClick={() => handleReaction('like')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-medium">
          <span className="text-xl">🔥</span>
          <span>{log.reactionCounts?.like || 0}</span>
        </button>
        <button onClick={() => handleReaction('rocket')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-medium">
          <span className="text-xl">🚀</span>
          <span>{log.reactionCounts?.rocket || 0}</span>
        </button>
      </div>

      <div className="mt-12 pt-10 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Discussion ({comments.length})</h3>
        
        <div className="space-y-8 mb-10">
          {comments.map(comment => (
             <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>

        <form onSubmit={handlePostComment} className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors shadow-sm"
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="px-6 bg-black text-white rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-black/5 font-medium"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
