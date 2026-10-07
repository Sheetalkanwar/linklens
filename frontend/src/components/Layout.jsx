import {
  BarChart3,
  Link2,
  LogOut,
  Plus,
  Zap,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { api } from "../lib/api";

export default function Layout({ user }) {
  const navigate = useNavigate();

  async function logout() {
    await api("/api/auth/logout", {
      method: "POST",
    });

    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Zap size={17} fill="currentColor" />
          </span>
          <span>LinkLens</span>
        </div>

        <nav>
          <NavLink to="/dashboard">
            <BarChart3 size={18} />
            Overview
          </NavLink>

          <NavLink to="/links">
            <Link2 size={18} />
            My Links
          </NavLink>

          <NavLink to="/links/new" className="create-nav">
            <Plus size={18} />
            Create link
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-user">
            <div className="avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <button className="ghost-btn" onClick={logout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}