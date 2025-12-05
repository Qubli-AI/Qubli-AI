import React, { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import QuizGenerator from "./components/QuizGenerator.jsx";
import QuizTaker from "./components/QuizTaker.jsx";
import Overview from "./components/Overview.jsx";
import Login from "./components/Login.jsx";
import StorageService from "./services/storageService.js";

// Protected Route Wrapper
const ProtectedRoute = ({ children, auth }) => {
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [auth, setAuth] = useState({ isAuthenticated: false, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth({ isAuthenticated: true, user });
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth({ isAuthenticated: true, user });
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setAuth({ isAuthenticated: false, user: null });
  };

  const refreshUser = () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth((prev) => ({ ...prev, user }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <CircularProgress sx={{ color: "#2563eb" }} size={50} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            auth.isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute auth={auth}>
              <Layout
                user={auth.user}
                onLogout={handleLogout}
                refreshUser={refreshUser}
              >
                <Dashboard user={auth.user} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/generate"
          element={
            <ProtectedRoute auth={auth}>
              <Layout
                user={auth.user}
                onLogout={handleLogout}
                refreshUser={refreshUser}
              >
                <QuizGenerator
                  user={auth.user}
                  onGenerateSuccess={refreshUser}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute auth={auth}>
              <Layout
                user={auth.user}
                onLogout={handleLogout}
                refreshUser={refreshUser}
              >
                <QuizTaker
                  user={auth.user}
                  onComplete={refreshUser}
                  onLimitUpdate={refreshUser}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/overview"
          element={
            <ProtectedRoute auth={auth}>
              <Layout
                user={auth.user}
                onLogout={handleLogout}
                refreshUser={refreshUser}
              >
                <Overview user={auth.user} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcards"
          element={<Navigate to="/overview" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;
