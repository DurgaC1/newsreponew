import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Category from './pages/Category';
import Login from './pages/Login';
import Register from './pages/Register';
import Bookmarks from './pages/Bookmarks';

function TopBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };
  return (
    <div className="flex justify-between items-center mb-6">
      <div />
      <div className="flex items-center gap-3 text-sm">
        <Link to="/bookmarks" className="text-slate-600 hover:text-sky-600">Bookmarks</Link>
        {user ? (
          <>
            <span className="text-slate-500">{user.email}</span>
            <button onClick={logout} className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-600 hover:text-sky-600">Login</Link>
            <Link
              to="/register"
              className="px-3 py-1 rounded-xl bg-white shadow-sm border border-slate-100 hover:border-sky-200"
            >
              Get access
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-6xl mx-auto flex gap-6 px-4 py-8">
        <Sidebar />
        <main className="flex-1">
          <TopBar />
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/category/:category"
          element={
            <Layout>
              <Category />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <Register />
            </Layout>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <Layout>
              <Bookmarks />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
