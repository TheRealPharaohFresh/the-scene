import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SplashScreen from "../features/splash/SplashScreen";
import ProtectedRoute from "../components/ui/layout/ProtectedRoute";
import { hasCompletedProfile, listenForAuthState } from "../features/auth/authService";

import "./App.css";

const Login = lazy(() => import("../features/auth/Login"));
const Register = lazy(() => import("../features/auth/Register"));
const CreateProfile = lazy(() => import("../features/auth/onboarding/CreateProfile"));
const Dashboard = lazy(() => import("../features/auth/dashboard/Dashboard"));
const Profile = lazy(() => import("../features/auth/profile/Profile"));
const MemberProfile = lazy(() => import("../features/auth/discovery/MemberProfile"));
const Forum = lazy(() => import("../features/community/Forum"));
const ThreadPage = lazy(() => import("../features/community/ThreadPage"));
const GroupPage = lazy(() => import("../features/community/GroupPage"));
const Opportunities = lazy(() => import("../features/community/Opportunities"));
const BusinessPage = lazy(() => import("../features/community/Business"));
const Admin = lazy(() => import("../features/community/Admin"));
const Premium = lazy(() => import("../features/community/Premium"));
const Matches = lazy(() => import("../features/messages/Matches"));
const Chat = lazy(() => import("../features/messages/Chat"));
const Discover = lazy(() => import("../features/auth/discovery/Discover"));

function HomeRedirect() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    void listenForAuthState((user) => {
      if (mounted) {
        setUserId(user?.uid ?? null);
        setAuthError(user?.profileStatusError ?? "");
        setAuthReady(true);
      }
    }).then((stopListening) => {
      if (mounted) unsubscribe = stopListening;
      else stopListening();
    }).catch((error: unknown) => {
      if (!mounted) return;
      setAuthError(error instanceof Error ? error.message : "Unable to verify your sign-in status.");
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [retryCount]);

  if (!authReady) {
    return <SplashScreen />;
  }

  if (authError) {
    return (
      <div role="alert">
        <p>{authError}</p>
        <button
          type="button"
          onClick={() => {
            setAuthError("");
            setAuthReady(false);
            setRetryCount((count) => count + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={hasCompletedProfile(userId) ? "/discover" : "/create-profile"} replace />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {showSplash ? (
        <SplashScreen />
      ) : (
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/create-profile"
              element={
                <ProtectedRoute requireProfileComplete={false}>
                  <CreateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <CreateProfile editMode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <Discover />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/:memberId"
              element={
                <ProtectedRoute>
                  <MemberProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/threads/:threadId"
              element={
                <ProtectedRoute>
                  <ThreadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <ProtectedRoute>
                  <Premium />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:matchId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <Opportunities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
      )}
    </BrowserRouter>
  );
}

export default App;
