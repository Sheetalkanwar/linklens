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

  async function loadAnalytics() {
    try {
      const data = await api("/api/analytics");
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    }
  }

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
    }
  }

  // Initial application load
  useEffect(() => {
    load();
  }, []);

  // Automatically refresh analytics every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadAnalytics();
    }, 5000);

    // Refresh immediately when user comes back to the tab
    const handleFocus = () => {
      loadAnalytics();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  if (user === undefined) {
    return <div className="loading">Loading LinkLens…</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Auth mode="login" />}
      />

      <Route
        path="/register"
        element={
          user ? <Navigate to="/dashboard" /> : <Auth mode="register" />
        }
      />

      {user ? (
        <Route element={<Layout user={user} />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard analytics={analytics} />}
          />

          <Route
            path="/links"
            element={<Links links={links} reload={load} />}
          />

          <Route
            path="/links/new"
            element={<NewLink />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" />}
          />
        </Route>
      ) : (
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      )}
    </Routes>
  );
}