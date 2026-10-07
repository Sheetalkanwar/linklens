import { Copy, ExternalLink, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { API_URL } from "../lib/api";

export default function LinkCard({ link, onChange }) {
  const [busy, setBusy] = useState(false);
  const shortUrl = link.short_url || `${API_URL}/${link.short_code}`;
  async function copy() { await navigator.clipboard.writeText(shortUrl); alert("Short link copied"); }
  async function toggle() {
    setBusy(true);
    try { const r = await fetch(`${API_URL}/api/links/${link.id}`, { method: "PATCH", credentials: "include", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: link.status === "active" ? "paused" : "active" }) }); if (!r.ok) throw new Error(); onChange(); } finally { setBusy(false); }
  }
  async function remove() { if (!confirm("Delete this link?")) return; await fetch(`${API_URL}/api/links/${link.id}`, { method:"DELETE", credentials:"include" }); onChange(); }
  return <article className="link-card">
    <div className="link-main">
      <div className="link-icon"><Link2Icon /></div>
      <div className="link-copy"><div className="link-title">{link.title || link.short_code}</div><a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a><div className="destination">{link.destination_url}</div></div>
    </div>
    <div className="link-stats"><strong>{link.clicks}</strong><span>clicks</span></div>
    <span className={`status ${link.status}`}>{link.status}</span>
    <div className="link-actions"><button title="Copy" onClick={copy}><Copy size={16}/></button><a title="Open" href={shortUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a><button title={link.status === "active" ? "Pause" : "Resume"} disabled={busy} onClick={toggle}>{link.status === "active" ? <Pause size={16}/> : <Play size={16}/>}</button><button title="Delete" onClick={remove}><Trash2 size={16}/></button></div>
  </article>;
}
function Link2Icon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
