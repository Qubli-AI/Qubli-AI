import { useState, useEffect, lazy, Suspense } from "react";
import { ToastContainer, Zoom } from "react-toastify";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Lazy-loaded components for code splitting
const Layout = lazy(() => import("./components/Layout.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const QuizGenerator = lazy(() => import("./components/QuizGenerator.jsx"));
const QuizTaker = lazy(() => import("./components/QuizTaker.jsx"));
const Overview = lazy(() => import("./components/Overview.jsx"));
const Subscription = lazy(() => import("./components/Subscription.jsx"));
const AuthForm = lazy(() => import("./components/AuthForm.jsx"));
const VerifyEmail = lazy(() => import("./components/VerifyEmail.jsx"));
const OAuthCallback = lazy(() => import("./components/OAuthCallback.jsx"));
const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const FeaturesPage = lazy(() => import("./components/FeaturesPage.jsx"));
const TestimonialsPage = lazy(() =>
  import("./components/TestimonialsPage.jsx")
);
const Achievements = lazy(() => import("./components/Achievements.jsx"));
const Leaderboard = lazy(() => import("./components/Leaderboard.jsx"));

// Admin components
const AdminLogin = lazy(() => import("./components/AdminLogin.jsx"));
const AdminLayout = lazy(() => import("./components/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./components/AdminUsers.jsx"));
const AdminUserDetail = lazy(() => import("./components/AdminUserDetail.jsx"));
const AdminQuizzes = lazy(() => import("./components/AdminQuizzes.jsx"));
const AdminQuizDetail = lazy(() => import("./components/AdminQuizDetail.jsx"));
const AdminBlogs = lazy(() => import("./components/AdminBlogs.jsx"));
const AdminActivity = lazy(() => import("./components/AdminActivity.jsx"));

// Static pages
const Pricing = lazy(() => import("./components/Pricing.jsx"));
const About = lazy(() => import("./components/About.jsx"));
const Contact = lazy(() => import("./components/Contact.jsx"));
const Policies = lazy(() => import("./components/Policies.jsx"));
const Terms = lazy(() => import("./components/Terms.jsx"));
const BlogList = lazy(() => import("./components/BlogList.jsx"));
const BlogPost = lazy(() => import("./components/BlogPost.jsx"));
const PublicLayout = lazy(() => import("./components/PublicLayout.jsx"));
const NotFound = lazy(() => import("./components/NotFound.jsx"));
import StorageService from "./services/storageService.js";
import { useTheme } from "./hooks/useTheme.js";

// Protected Route Wrapper
const ProtectedRoute = ({ children, auth }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // If token is missing from localStorage but auth says we're authenticated,
  // the user was logged out in another window/tab, so redirect
  if (!token && auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!auth.user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Protected Admin Route Wrapper
const ProtectedAdminRoute = ({ children }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [auth, setAuth] = useState({ isAuthenticated: false, user: null });
  const [loading, setLoading] = useState(true);
  useTheme(); // Initialize theme on app load

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuth({ isAuthenticated: true, user });
    }
    setLoading(false);
  }, []);

  // Listen for user updates dispatched from other parts of the app
  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event.detail || StorageService.getCurrentUser();
      if (updatedUser) setAuth({ isAuthenticated: true, user: updatedUser });
    };

    // Listen for session logout event (no page reload)
    const handleSessionLogout = () => {
      setAuth({ isAuthenticated: false, user: null });
    };

    // Listen for account disabled event - redirect to landing with error message
    const handleAccountDisabled = (event) => {
      setAuth({ isAuthenticated: false, user: null });
      // Show error toast and redirect
      window.location.href =
        "/?message=" +
        encodeURIComponent(
          event.detail?.message || "Your account has been disabled"
        );
    };

    // Listen for account banned event - redirect to landing with error message
    const handleAccountBanned = (event) => {
      setAuth({ isAuthenticated: false, user: null });
      // Show error toast and redirect
      window.location.href =
        "/?message=" +
        encodeURIComponent(
          event.detail?.message || "Your account has been banned"
        );
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("sessionLogout", handleSessionLogout);
    window.addEventListener("accountDisabled", handleAccountDisabled);
    window.addEventListener("accountBanned", handleAccountBanned);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("sessionLogout", handleSessionLogout);
      window.removeEventListener("accountDisabled", handleAccountDisabled);
      window.removeEventListener("accountBanned", handleAccountBanned);
    };
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
    // Full page reload to clear all state and redirect to landing page
    window.location.href = "/";
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await StorageService.refreshUser();
      setAuth({ ...auth, user: updatedUser });
    } catch {
      // Failed to refresh user - ignore and keep current auth state
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={2}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
        transition={Zoom}
        toastStyle={{
          width: "auto",
          color: "#000",
          padding: "0 40px 0 30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          fontWeight: "500",
        }}
      />
      <Analytics />
      <SpeedInsights />
      <Router>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen bg-background">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-3 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:userId" element={<AdminUserDetail />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="quizzes/:quizId" element={<AdminQuizDetail />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="activity" element={<AdminActivity />} />
            </Route>

            <Route
              path="/auth"
              element={
                auth.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <AuthForm onLogin={handleLoginSuccess} />
                )
              }
            />

            <Route path="/auth/verify-email" element={<VerifyEmail />} />

            <Route element={<PublicLayout auth={auth} />}>
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/privacy" element={<Policies />} />
              <Route path="/terms" element={<Terms />} />

              {/* Blog Routes */}
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blogs/:id" element={<BlogPost />} />

              <Route
                path="/"
                element={
                  <LandingPage auth={auth} onLogin={handleLoginSuccess} />
                }
              />
            </Route>

            <Route
              path="/dashboard"
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
              path="/subscription"
              element={
                <ProtectedRoute auth={auth}>
                  <Layout
                    user={auth.user}
                    onLogout={handleLogout}
                    refreshUser={refreshUser}
                  >
                    <Subscription user={auth.user} onUpgrade={refreshUser} />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/achievements"
              element={
                <ProtectedRoute auth={auth}>
                  <Layout
                    user={auth.user}
                    onLogout={handleLogout}
                    refreshUser={refreshUser}
                  >
                    <Achievements user={auth.user} />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute auth={auth}>
                  <Layout
                    user={auth.user}
                    onLogout={handleLogout}
                    refreshUser={refreshUser}
                  >
                    <Leaderboard user={auth.user} />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/flashcards"
              element={<Navigate to="/overview" replace />}
            />

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
};

export default App;
