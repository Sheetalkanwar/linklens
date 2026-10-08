import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { api } from "./lib/api";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Links from "./pages/Links";
import NewLink from "./pages/NewLink";

import "./styles.css";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // --------------------------------------------
  // Load analytics
  // --------------------------------------------
  async function loadAnalytics() {
    try {
      const data = await api("/api/analytics");
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    }
  }

  // --------------------------------------------
  // Load authenticated user + app data
  // --------------------------------------------
  async function load() {
    try {
      const me = await api("/api/auth/me");

      setUser(me);

      const [ls, an] = await Promise.all([
        api("/api/links"),
        api("/api/analytics"),
      ]);

      setLinks(ls);
      setAnalytics(an);
    } catch (error) {
      console.error("Failed to load LinkLens:", error);

      setUser(null);
      setLinks([]);
      setAnalytics(null);
    }
  }

  // --------------------------------------------
  // Initial authentication check
  // --------------------------------------------
  useEffect(() => {
    load();
  }, []);

  // --------------------------------------------
  // Refresh analytics every 5 seconds
  // --------------------------------------------
  useEffect(() => {
    if (!user) {
      return;
    }

    const interval = setInterval(() => {
      loadAnalytics();
    }, 5000);

    const handleFocus = () => {
      loadAnalytics();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  // --------------------------------------------
  // Called after successful login/register
  // --------------------------------------------
  async function handleLogin(loggedInUser) {
    setUser(loggedInUser);

    try {
      const [ls, an] = await Promise.all([
        api("/api/links"),
        api("/api/analytics"),
      ]);

      setLinks(ls);
      setAnalytics(an);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);

      setLinks([]);
      setAnalytics(null);
    }
  }

  // --------------------------------------------
  // Loading screen
  // --------------------------------------------
  if (user === undefined) {
    return (
      <div className="loading">
        Loading LinkLens…
      </div>
    );
  }

  // --------------------------------------------
  // Routes
  // --------------------------------------------
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Auth
              mode="login"
              onLogin={handleLogin}
            />
          )
        }
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Auth
              mode="register"
              onLogin={handleLogin}
            />
          )
        }
      />

      {/* AUTHENTICATED APPLICATION */}
      {user ? (
        <Route element={<Layout user={user} />}>
          {/* ROOT → DASHBOARD */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <Dashboard
                analytics={analytics}
              />
            }
          />

          {/* LINKS */}
          <Route
            path="/links"
            element={
              <Links
                links={links}
                reload={load}
              />
            }
          />

          {/* CREATE LINK */}
          <Route
            path="/links/new"
            element={<NewLink />}
          />

          {/* UNKNOWN AUTHENTICATED ROUTE */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Route>
      ) : (
        /* NOT AUTHENTICATED */
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      )}
    </Routes>
  );
}