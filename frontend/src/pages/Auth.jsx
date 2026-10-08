import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Auth({ mode, onLogin }) {
  const signup = mode === "register";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      const user = await api(
        `/api/auth/${signup ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify(form),
        }
      );

      // Update the authenticated user in App.jsx
      if (onLogin) {
        onLogin(user);
      }

      // Send the user to the dashboard
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(
        error?.message || "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark">✦</span>
        LinkLens
      </div>

      <div className="auth-card">
        <div className="eyebrow">LINK INTELLIGENCE</div>

        <h1>
          {signup
            ? "Build smarter short links."
            : "Welcome back."}
        </h1>

        <p>
          {signup
            ? "Create, share and understand every click."
            : "Your links and analytics are waiting."}
        </p>

        <form onSubmit={submit}>
          {signup && (
            <label>
              Name

              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Sheetal"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email

            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={
                signup ? "new-password" : "current-password"
              }
            />
          </label>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary full"
            disabled={busy}
          >
            {busy
              ? "Please wait…"
              : signup
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          {signup
            ? "Already have an account?"
            : "New to LinkLens?"}{" "}

          <Link to={signup ? "/login" : "/register"}>
            {signup ? "Sign in" : "Create one"}
          </Link>
        </div>
      </div>
    </div>
  );
}