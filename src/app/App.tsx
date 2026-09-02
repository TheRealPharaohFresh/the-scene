import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SplashScreen from "../features/splash/SplashScreen";
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import CreateProfile from "../features/auth/onboarding/CreateProfile";
import Dashboard from "../features/auth/dashboard/Dashboard";
import Profile from "../features/auth/profile/Profile";
import ProtectedRoute from "../components/ui/layout/ProtectedRoute";
import { hasCompletedProfile, listenForAuthState } from "../features/auth/authService";

import "./App.css";

function HomeRedirect() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      unsubscribe = await listenForAuthState((user) => {
        setUserId(user?.uid ?? null);
        setAuthReady(true);
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, []);

  if (!authReady) {
    return <SplashScreen />;
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={hasCompletedProfile() ? "/dashboard" : "/create-profile"} replace />;
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-profile" element={<CreateProfile />} />
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
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
