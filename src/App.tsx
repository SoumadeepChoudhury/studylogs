/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import EditorPage from './pages/EditorPage';
import LogView from './pages/LogView';
import Folders from './pages/Folders';
import Stats from './pages/Stats';
import Profile from './pages/Profile';

export default function App() {
  const { user, loading } = useAuth();



  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFC] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Feed />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit/:id?" element={<EditorPage />} />
        <Route path="/log/:id" element={<LogView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
