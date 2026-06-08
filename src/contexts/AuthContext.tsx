import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  partnerId?: string;
  createdAt: number;
  updatedAt: number;
  bio?: string;
  streak: number;
  longestStreak: number;
  lastStudyDate?: string;
  lastLoginDate?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logOut: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          const today = new Date().toDateString();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (data.lastStudyDate && data.lastStudyDate !== today && data.lastStudyDate !== yesterday.toDateString()) {
            data.streak = 0;
            await setDoc(userRef, { streak: 0, lastLoginDate: today }, { merge: true });
          } else if (data.lastLoginDate !== today) {
            await setDoc(userRef, { lastLoginDate: today }, { merge: true });
          }

          data.lastLoginDate = today;
          setProfile(data);
        } else {
          const today = new Date().toDateString();
          const newProfile: UserProfile = {
            id: currentUser.uid,
            name: currentUser.displayName || 'Anonymous User',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            streak: 0,
            longestStreak: 0,
            lastLoginDate: today,
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, updatedAt: Date.now() }, { merge: true });
    setProfile(prev => prev ? { ...prev, ...data, updatedAt: Date.now() } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
