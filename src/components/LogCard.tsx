import { StudyLog } from '../pages/Feed';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Lock, Globe, MoreHorizontal, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function LogCard({ log }: { log: StudyLog }) {
  const { user } = useAuth();
  const isAuthor = user?.uid === log.authorId;
  const [authorName, setAuthorName] = useState(isAuthor ? 'You' : 'Loading...');
  const [authorPhoto, setAuthorPhoto] = useState('');

  const handleReaction = async (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    if (!log.id) return;
    const logRef = doc(db, 'logs', log.id);
    await updateDoc(logRef, {
      [`reactionCounts.${type}`]: increment(1)
    });
  };

  useEffect(() => {
    let isMounted = true;
    if (isAuthor) {
      setAuthorName('You');
      if (user?.photoURL) setAuthorPhoto(user.photoURL);
      return () => { isMounted = false; };
    }
    const fetchAuthor = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', log.authorId));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setAuthorName(data.name || 'Unknown');
          setAuthorPhoto(data.photoURL || '');
        } else if (isMounted) {
          setAuthorName('Unknown');
        }
      } catch (e) {
        if (isMounted) setAuthorName('Unknown');
      }
    };
    fetchAuthor();
    return () => { isMounted = false; };
  }, [log.authorId, isAuthor, user?.photoURL]);

  return (
    <article className="group relative border-b border-slate-100 pb-10 pt-6 first:pt-0">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {authorPhoto ? (
            <img src={authorPhoto} alt="" className="w-6 h-6 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold uppercase">
              {authorName.charAt(0)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{authorName}</span>
            <span className="text-slate-300">•</span>
            {/* {log.folderId && (
              <>
                <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Folder</span>
                <span className="text-slate-300">•</span>
              </>
            )} */}
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              {formatDistanceToNow(log.createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {log.visibility === 'private' ? (
            <span className="text-[10px] font-bold py-0.5 px-2 bg-indigo-50 rounded text-indigo-400 uppercase tracking-tighter">Private</span>
          ) : (
            <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 rounded text-slate-400 uppercase tracking-tighter">Public</span>
          )}
          {isAuthor && (
            <button className="text-slate-400 hover:text-black transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Link to={`/log/${log.id}`} className="block cursor-pointer">
        <h2 className="font-serif text-3xl leading-tight mb-4 group-hover:text-slate-600 transition-colors">{log.topicTitle}</h2>
        <div
          className="text-slate-600 leading-relaxed line-clamp-3 mb-6 font-serif italic text-lg prose prose-slate prose-p:my-0 max-w-none"
          dangerouslySetInnerHTML={{ __html: log.content.replace(/<[^>]+>/g, ' ').substring(0, 300) + '...' }}
        />
      </Link>

      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <button onClick={(e) => handleReaction(e, 'like')} className="flex items-center gap-1.5 hover:text-black transition-colors group/btn">
            <span className="text-base grayscale group-hover/btn:grayscale-0">🔥</span>
            <span>{log.reactionCounts?.like || 0}</span>
          </button>
          <button onClick={(e) => handleReaction(e, 'rocket')} className="flex items-center gap-1.5 hover:text-black transition-colors group/btn">
            <span className="text-base grayscale group-hover/btn:grayscale-0">🚀</span>
            <span>{log.reactionCounts?.rocket || 0}</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
          <button className="hover:text-black transition-colors">
            {log.commentCount || 0} Comments
          </button>
        </div>
      </div>
    </article>
  );
}
