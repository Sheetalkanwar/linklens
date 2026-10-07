import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Auth({ mode }) {
  const signup = mode === "register";
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e){ e.preventDefault(); setError(""); setBusy(true); try { await api(`/api/auth/${signup ? "register" : "login"}`, {method:"POST", body:JSON.stringify(form)}); navigate("/dashboard"); } catch(e){setError(e.message)} finally{setBusy(false)} }
  return <div className="auth-page"><div className="auth-brand"><span className="brand-mark">✦</span> LinkLens</div><div className="auth-card"><div className="eyebrow">LINK INTELLIGENCE</div><h1>{signup ? "Build smarter short links." : "Welcome back."}</h1><p>{signup ? "Create, share and understand every click." : "Your links and analytics are waiting."}</p><form onSubmit={submit}>{signup && <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Sheetal"/></label>}<label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button></form><div className="auth-switch">{signup ? "Already have an account?" : "New to LinkLens?"} <Link to={signup ? "/login" : "/register"}>{signup ? "Sign in" : "Create one"}</Link></div></div></div>;
}
