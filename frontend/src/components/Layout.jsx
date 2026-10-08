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
} from "react-router-dom";

export default function Layout({ user, onLogout }) {
  async function logout() {
    await onLogout();
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

          <NavLink
            to="/links/new"
            className="create-nav"
          >
            <Plus size={18} />
            Create link
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-user">
            <div className="avatar">
              {user?.name
                ? user.name.slice(0, 1).toUpperCase()
                : "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email || ""}</span>
            </div>
          </div>

          <button
            type="button"
            className="ghost-btn"
            onClick={logout}
          >
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