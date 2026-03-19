import { useState, useEffect, useCallback } from "react";

/* ─── Account Configs ─── */
const ACCOUNTS = {
  attract: {
    id: "attract",
    label: "集客用",
    sheetId: "15oOCrgXEC_3mqZxtPlT4b47NZD9IbP1Zy-SkQ4ypn5M",
    gid: "91948294",
    sheetUrl: "https://docs.google.com/spreadsheets/d/15oOCrgXEC_3mqZxtPlT4b47NZD9IbP1Zy-SkQ4ypn5M/edit#gid=91948294",
    color: "#E1306C",
    gradient: "linear-gradient(135deg,#833AB4,#E1306C,#F77737)",
    initial: [
      { no: "01", title: "【No.1】&healthy", format: "フィード投稿", postDate: "03/07", phase: "delivered", deliveryDate: "03/06", driveUrl: "https://drive.google.com/drive/folders/1njVuEbRbt2JQGOjlqkPgDumbAU2rOpo9", history: ["構成確認 承認","制作中","初稿確認 承認","最終確認 承認","納品完了"] },
      { no: "02", title: "【No.2】メロい女 ぱっちり束感♡愛されeyes", format: "フィード投稿", postDate: "03/11", phase: "delivered", deliveryDate: "03/10", driveUrl: "https://drive.google.com/drive/folders/10ldJQmPo6HQTNlbNtnmho8tRphEofJpc", history: ["構成確認 承認","制作中","初稿確認 承認","最終確認 承認","納品完了"] },
      { no: "03", title: "【No.3】彼ウケ♡多幸感バブみeye4選", format: "フィード投稿", postDate: "03/14", phase: "delivered", deliveryDate: "03/13", driveUrl: "https://drive.google.com/drive/folders/1PF6U8LLbH1AHYLsT0L7iBLmGZ-5mZaKe", history: ["構成確認 承認","制作中","初稿確認 承認","最終確認 承認","納品完了"] },
      { no: "04", title: "【No.4】Lush Lift", format: "フィード投稿", postDate: "03/18", phase: "delivered", deliveryDate: "03/17", driveUrl: "https://drive.google.com/drive/folders/1vXJ2W9SL9Q-8Zg6CWIfS0WbVZpapnhpD", history: ["構成確認 承認","制作中","初稿確認 承認","最終確認 承認","納品完了"] },
      { no: "05", title: "【No.5】春っぽうるちゅるん桜色Pinkネイル３選", format: "フィード投稿", postDate: "03/21", phase: "material", deliveryDate: "03/20", driveUrl: "https://drive.google.com/drive/folders/1G0TtG5gT6PtH18A77x8xaomv2EZ3sS5X", history: [] },
      { no: "06", title: "【No.6】アイブロウコスメ詳細", format: "フィード投稿", postDate: "03/25", phase: "material", deliveryDate: "03/24", driveUrl: "https://drive.google.com/drive/folders/1-BkOxgp61ZdqifsLwl2vJA5gZ0Tsy6Fw", history: [] },
      { no: "07", title: "【No.7】ズボラ女子必見 1秒で爆盛れeye", format: "フィード投稿", postDate: "03/28", phase: "material", deliveryDate: "03/27", driveUrl: "https://drive.google.com/drive/folders/1dPOtFYsxJhyDacYycgmOC5itszrX8dYC", history: [] },
      { no: "08", title: "【No.8】メイク・美容液 詳細", format: "フィード投稿", postDate: "03/31", phase: "material", deliveryDate: "03/30", driveUrl: "https://drive.google.com/drive/folders/1kYPGNv465tISxkGr5waLULzWgpmJ4KfU", history: [] },
    ],
  },
  recruit: {
    id: "recruit",
    label: "採用用",
    sheetId: "1VYAYvvYYnlljJr-APngbsEnMRrB5gEn0MaQoYedXNfI",
    gid: "1429514140",
    sheetUrl: "https://docs.google.com/spreadsheets/d/1VYAYvvYYnlljJr-APngbsEnMRrB5gEn0MaQoYedXNfI/edit?gid=1429514140",
    color: "#3B8FE3",
    gradient: "linear-gradient(135deg,#3B8FE3,#18B07A)",
    initial: [
      { no: "01", title: "採用No.1", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "02", title: "採用No.2", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "03", title: "採用No.3", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "04", title: "採用No.4", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "05", title: "採用No.5", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "06", title: "採用No.6", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "07", title: "採用No.7", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
      { no: "08", title: "採用No.8", format: "フィード投稿", postDate: "", phase: "material", deliveryDate: "", driveUrl: "", history: [] },
    ],
  },
};

/* ─── Phase Definitions ─── */
const PHASES = [
  { id: "material", label: "構成確認", color: "#7C6BF0", bg: "#F0EEFF", icon: "①" },
  { id: "production", label: "制作中", color: "#C98118", bg: "#FDF3E2", icon: "⟳" },
  { id: "draft", label: "初稿確認", color: "#E2622E", bg: "#FDF0EB", icon: "②" },
  { id: "draft_fb", label: "初稿FB", color: "#D4500A", bg: "#FDE8DE", icon: "↩" },
  { id: "final", label: "最終確認", color: "#3B8FE3", bg: "#EAF3FD", icon: "③" },
  { id: "final_fb", label: "最終FB", color: "#2874C0", bg: "#E0EDFA", icon: "↩" },
  { id: "delivered", label: "納品完了", color: "#18B07A", bg: "#E4F8F0", icon: "✓" },
];
const DONE = { id: "delivered", label: "納品完了", color: "#18B07A", bg: "#E4F8F0" };
function phaseInfo(id) { return PHASES.find(p => p.id === id) || DONE; }
function phaseIndex(id) { return PHASES.findIndex(p => p.id === id); }
function phasePct(id) { return ({ material: 0, production: 15, draft: 30, draft_fb: 30, final: 60, final_fb: 60, delivered: 100 })[id] ?? 0; }
function cleanTitle(t) { return t?.replace(/【.*?】\s*/, "") || ""; }

/* ─── Phase derivation from sheet ─── */
function derivePhaseFromSheet(row) {
  if (row.colQ === true || row.colQ === "TRUE" || row.colQ === "true") return "delivered";
  if (row.colK === "完了") return "final";
  if (row.colI === true || row.colI === "TRUE" || row.colI === "true") {
    return row.colJ === "完了" ? "draft" : "production";
  }
  return "material";
}

async function syncFromSheet(sheetId, gid) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: `Access this Google Sheet CSV export URL and extract ALL column data:
https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&range=A4:Q11
Return ONLY a JSON array with no other text. For each row return:
{"no":"01","title":"...","format":"...","postDate":"03/07","colI":true/false,"colJ":"完了 or 未着手","colK":"完了 or 未着手","colQ":true/false,"deliveryDate":"...","driveUrl":""}
Column mapping:
- Column I = 構成確認フラグ (colI) - TRUE or FALSE
- Column J = 初稿ステータス (colJ)
- Column K = 納品確認ステータス (colK)
- Column Q = 納品完了フラグ (colQ) - TRUE or FALSE
- Return exact values from cells` }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("");
  const m = text.match(/\[[\s\S]*\]/);
  if (m) {
    const rows = JSON.parse(m[0]);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(row => ({
        no: row.no, title: row.title || "", format: row.format || "フィード投稿",
        postDate: row.postDate || "", phase: derivePhaseFromSheet(row),
        deliveryDate: row.deliveryDate || "", driveUrl: row.driveUrl || "",
        history: [], _sheet: { colI: row.colI, colJ: row.colJ, colK: row.colK, colQ: row.colQ },
      }));
    }
  }
  throw new Error("sync_failed");
}

/* ─── Shared Components ─── */
function FadeIn({ children, delay = 0, style = {} }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.4s ease, transform 0.4s ease", ...style }}>{children}</div>;
}
function Card({ children, style = {}, accent = null }) {
  return <div style={{ background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden", borderTop: accent ? `3px solid ${accent}` : undefined, ...style }}>{children}</div>;
}
function Badge({ label, color, bg }) {
  return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{label}</span>;
}
function Btn({ children, onClick, color = "#7C6BF0", outline = false, small = false, disabled = false, style = {} }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? "5px 12px" : "8px 18px", borderRadius: 10, fontSize: small ? 11 : 12, fontWeight: 600, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s", border: outline ? `1.5px solid ${color}` : "none", background: outline ? "transparent" : `linear-gradient(135deg, ${color}, ${color}CC)`, color: outline ? color : "#fff", opacity: disabled ? 0.5 : 1, boxShadow: outline ? "none" : `0 2px 8px ${color}30`, ...style }}>{children}</button>;
}

/* ─── Progress Ring ─── */
function ProgressMeter({ posts }) {
  const total = posts.length, done = posts.filter(p => p.phase === "delivered").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 40, circ = 2 * Math.PI * r, offset = circ - (circ * pct / 100);
  const color = pct === 100 ? "#18B07A" : pct >= 50 ? "#3B8FE3" : "#E2622E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
      <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth="7" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1 }}>{pct}<span style={{ fontSize: 11, fontWeight: 400 }}>%</span></span>
          <span style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>{done}/{total}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { label: "確認待ち", ids: ["material", "draft", "final"], color: "#E2622E" },
          { label: "制作中", ids: ["production"], color: "#C98118" },
          { label: "FB対応中", ids: ["draft_fb", "final_fb"], color: "#D4500A" },
          { label: "納品完了", ids: ["delivered"], color: "#18B07A" },
        ].map(g => {
          const cnt = posts.filter(p => g.ids.includes(p.phase)).length;
          return cnt > 0 ? (
            <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
              <span style={{ color: "var(--color-text-secondary)", minWidth: 56 }}>{g.label}</span>
              <div style={{ flex: 1, height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(cnt / total) * 100}%`, height: "100%", background: g.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontWeight: 600, color: g.color, minWidth: 18, textAlign: "right" }}>{cnt}</span>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

/* ─── Action Panel ─── */
function ActionPanel({ posts, onNavigate }) {
  const active = posts.filter(p => p.phase !== "delivered");
  if (!active.length) return <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>🎉 全投稿の納品完了</div>;
  const needsReview = active.filter(p => ["material", "draft", "final"].includes(p.phase));
  const inProd = active.filter(p => p.phase === "production");
  const inFB = active.filter(p => ["draft_fb", "final_fb"].includes(p.phase));
  const actionLabel = { material: "構成を確認", draft: "初稿を確認", final: "最終版を確認" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {needsReview.length > 0 && (
        <div style={{ background: "#FDF0EB", borderRadius: 12, padding: "10px 14px", borderLeft: "3px solid #E2622E" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#E2622E", marginBottom: 6 }}>確認が必要 ({needsReview.length})</div>
          {needsReview.map(p => (
            <div key={p.no} onClick={() => onNavigate && onNavigate(p.no)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#fff", borderRadius: 8, marginBottom: 4, cursor: "pointer", fontSize: 11, transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(226,98,46,0.12)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <span style={{ fontWeight: 700, color: "#E2622E", minWidth: 36 }}>No.{p.no}</span>
              <span style={{ color: "var(--color-text-primary)", flex: 1, fontWeight: 500 }}>{cleanTitle(p.title).slice(0, 14)}</span>
              <span style={{ fontSize: 10, color: "#E2622E", fontWeight: 500 }}>{actionLabel[p.phase]}</span>
              <span style={{ color: "#E2622E" }}>→</span>
            </div>
          ))}
        </div>
      )}
      {inProd.length > 0 && (
        <div style={{ background: "#FDF3E2", borderRadius: 12, padding: "10px 14px", borderLeft: "3px solid #C98118" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#C98118", marginBottom: 4 }}>制作中 ({inProd.length}) — 対応不要</div>
          {inProd.map(p => (
            <div key={p.no} style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "3px 0" }}>No.{p.no} {cleanTitle(p.title).slice(0, 14)}</div>
          ))}
        </div>
      )}
      {inFB.length > 0 && (
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "10px 14px", borderLeft: "3px solid #D4500A" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#D4500A", marginBottom: 4 }}>FB対応中 ({inFB.length})</div>
          {inFB.map(p => (
            <div key={p.no} style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "3px 0" }}>No.{p.no} {cleanTitle(p.title).slice(0, 14)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Post Card (compact) ─── */
function PostCard({ post, onAction, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const cardRef = useCallback(node => { if (node && defaultOpen) node.scrollIntoView({ behavior: "smooth", block: "center" }); }, [defaultOpen]);
  const [fbText, setFbText] = useState("");
  const pi = phaseInfo(post.phase);
  const isDone = post.phase === "delivered";
  const canReview = ["material", "draft", "final"].includes(post.phase);
  const canReject = ["draft", "final"].includes(post.phase);
  const milestones = [
    { label: "構成", done: phaseIndex(post.phase) > 0 || isDone, active: post.phase === "material" },
    { label: "制作", done: phaseIndex(post.phase) > 1 || isDone, active: post.phase === "production" },
    { label: "初稿", done: phaseIndex(post.phase) > 3 || isDone, active: post.phase === "draft" || post.phase === "draft_fb" },
    { label: "最終", done: phaseIndex(post.phase) > 5 || isDone, active: post.phase === "final" || post.phase === "final_fb" },
    { label: "納品", done: isDone, active: false },
  ];
  return (
    <div ref={cardRef}>
    <Card style={{ transition: "box-shadow 0.2s", boxShadow: open ? "0 4px 20px rgba(0,0,0,0.06)" : "none", opacity: isDone ? 0.65 : 1, outline: defaultOpen ? "2px solid #E2622E40" : "none" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: isDone ? "#E4F8F0" : `${pi.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${pi.color}30` }}>
          {isDone ? <span style={{ fontSize: 14, color: "#18B07A" }}>✓</span> : <span style={{ fontSize: 12, fontWeight: 700, color: pi.color }}>{post.no}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>{cleanTitle(post.title)}</span>
            <Badge label={pi.label} color={pi.color} bg={pi.bg} />
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{post.format}{post.postDate ? ` · ${post.postDate}` : ""}</div>
        </div>
        <div style={{ width: 48, flexShrink: 0 }}>
          <div style={{ height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${phasePct(post.phase)}%`, height: "100%", background: pi.color, borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-tertiary)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>▾</div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--color-border-tertiary)" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <div style={{ animation: "fadeSlide 0.3s ease" }}>
            {/* Milestones */}
            <div style={{ display: "flex", margin: "14px 0 12px" }}>
              {milestones.map((ms, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {i > 0 && <div style={{ position: "absolute", top: 10, right: "50%", width: "100%", height: 2, background: ms.done ? "#18B07A" : "var(--color-border-tertiary)" }} />}
                  <div style={{ width: 22, height: 22, borderRadius: "50%", zIndex: 1, position: "relative", background: ms.done ? "#18B07A" : ms.active ? "#fff" : "var(--color-background-secondary)", border: ms.done ? "none" : ms.active ? "2px solid #E2622E" : "1.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: ms.done ? "#fff" : ms.active ? "#E2622E" : "var(--color-text-tertiary)", boxShadow: ms.active ? "0 0 0 3px #E2622E18" : "none" }}>
                    {ms.done ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 9, marginTop: 3, fontWeight: ms.done || ms.active ? 600 : 400, color: ms.done ? "#18B07A" : ms.active ? "#E2622E" : "var(--color-text-tertiary)" }}>{ms.label}</span>
                </div>
              ))}
            </div>
            {/* Dates */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[{ l: "投稿予定", v: post.postDate || "—", c: "#3B8FE3" }, { l: "納品日", v: post.deliveryDate || "—", c: "#18B07A" }].map((x, i) => (
                <div key={i} style={{ flex: 1, background: "var(--color-background-secondary)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border-tertiary)" }}>
                  <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{x.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
            {/* Drive */}
            {post.driveUrl && (
              <a href={post.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: 10, border: "1px solid var(--color-border-tertiary)", textDecoration: "none", marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #4285F4, #34A853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /><path d="M22 4L12 14.01l-3-3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>ドライブで確認</div>
                </div>
                <span style={{ fontSize: 12, color: "#4285F4" }}>↗</span>
              </a>
            )}
            {/* History */}
            {post.history?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: 4 }}>履歴</div>
                {post.history.map((h, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--color-text-secondary)", padding: "2px 8px", background: "var(--color-background-secondary)", borderRadius: 4, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: h.includes("差し戻し") ? "#E2622E" : "#18B07A", fontSize: 9 }}>{h.includes("差し戻し") ? "↩" : "✓"}</span>{h}
                  </div>
                ))}
              </div>
            )}
            {/* Actions */}
            {canReview && (
              <div style={{ borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                  {post.phase === "material" ? "構成の確認" : post.phase === "draft" ? "初稿の確認" : "最終版の確認"}
                </div>
                {canReject && (
                  <textarea value={fbText} onChange={e => setFbText(e.target.value)} placeholder="差し戻しFBを記入..."
                    style={{ width: "100%", minHeight: 50, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", fontSize: 11, lineHeight: 1.6, color: "var(--color-text-primary)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none", marginBottom: 8 }}
                    onFocus={e => e.target.style.borderColor = "#E2622E"} onBlur={e => e.target.style.borderColor = "var(--color-border-tertiary)"} />
                )}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {canReject && <Btn small color="#E2622E" outline onClick={() => { const next = post.phase === "draft" ? "draft_fb" : "final_fb"; onAction(post.no, next, `差し戻し: ${fbText || "修正依頼"}`); setFbText(""); }}>↩ 差し戻し</Btn>}
                  {post.phase === "material"
                    ? <Btn small color="#C98118" onClick={() => { onAction(post.no, "production", "構成承認 → 制作開始"); }}>✓ 承認（制作開始）</Btn>
                    : <Btn small color="#18B07A" onClick={() => { onAction(post.no, "delivered", "承認 → 納品完了"); }}>✓ 承認（納品完了）</Btn>
                  }
                </div>
              </div>
            )}
            {post.phase === "production" && <div style={{ borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 10, textAlign: "center", fontSize: 11, color: "#C98118", fontWeight: 600 }}>⟳ 制作中 — 対応不要</div>}
            {(post.phase === "draft_fb" || post.phase === "final_fb") && <div style={{ borderTop: "1px solid var(--color-border-tertiary)", paddingTop: 10, textAlign: "center", fontSize: 11, color: "#D4500A", fontWeight: 600 }}>🔄 FB対応中</div>}
          </div>
        </div>
      )}
    </Card>
    </div>
  );
}

/* ─── Account Section ─── */
function AccountSection({ account }) {
  const [posts, setPosts] = useState(account.initial);
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [openPostNo, setOpenPostNo] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const doSync = useCallback(async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const sheetData = await syncFromSheet(account.sheetId, account.gid);
      setPosts(prev => sheetData.map(sheet => {
        const existing = prev.find(p => p.no === sheet.no);
        if (!existing) return sheet;
        const sheetPhase = sheet.phase, appPhase = existing.phase;
        if (appPhase === "draft_fb" || appPhase === "final_fb") {
          if (sheetPhase === "delivered") return { ...existing, phase: "delivered", _sheet: sheet._sheet, history: [...(existing.history || []), "シート同期: 納品完了"] };
          return { ...existing, _sheet: sheet._sheet };
        }
        const order = ["material", "production", "draft", "draft_fb", "final", "final_fb", "delivered"];
        if (order.indexOf(sheetPhase) > order.indexOf(appPhase)) {
          return { ...existing, phase: sheetPhase, _sheet: sheet._sheet, history: [...(existing.history || []), `シート同期: ${phaseInfo(sheetPhase).label}`] };
        }
        return { ...existing, title: sheet.title || existing.title, postDate: sheet.postDate || existing.postDate, deliveryDate: sheet.deliveryDate || existing.deliveryDate, _sheet: sheet._sheet };
      }));
      setLastSync(new Date()); setSyncMsg("✓");
    } catch { setSyncMsg("失敗"); }
    setSyncing(false); setTimeout(() => setSyncMsg(null), 3000);
  }, [account.sheetId, account.gid]);

  useEffect(() => { const iv = setInterval(doSync, 60000); return () => clearInterval(iv); }, [doSync]);

  const handleAction = (no, nextPhase, note) => {
    setPosts(prev => prev.map(p => p.no !== no ? p : { ...p, phase: nextPhase, history: [...(p.history || []), `${phaseInfo(p.phase).label} → ${note}`] }));
  };

  // 8投稿ずつ
  const batch1 = posts.slice(0, 8);
  const batch2 = posts.slice(8);
  const [batch, setBatch] = useState("1");
  const currentPosts = batch === "1" ? batch1 : batch2;

  const countBy = (phases) => currentPosts.filter(p => phases.includes(p.phase)).length;
  const review = countBy(["material", "draft", "final"]);
  const production = countBy(["production"]);
  const fb = countBy(["draft_fb", "final_fb"]);
  const done = countBy(["delivered"]);
  const filtered = filter === "all" ? currentPosts : currentPosts.filter(p =>
    filter === "review" ? ["material", "draft", "final"].includes(p.phase) :
    filter === "production" ? p.phase === "production" :
    filter === "fb" ? ["draft_fb", "final_fb"].includes(p.phase) :
    filter === "done" ? p.phase === "delivered" : true
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Account header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: account.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, boxShadow: `0 2px 8px ${account.color}30` }}>{account.label.slice(0, 1)}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{account.label}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
              月8投稿
              {lastSync && <span style={{ color: "#18B07A", fontWeight: 500 }}>· {lastSync.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>}
              {syncMsg && <span style={{ color: syncMsg === "✓" ? "#18B07A" : "#E2622E", fontWeight: 600 }}>{syncMsg}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn small outline color="var(--color-text-tertiary)" onClick={doSync} disabled={syncing} style={{ boxShadow: "none", padding: "3px 8px", fontSize: 10 }}>{syncing ? "..." : "↻"}</Btn>
          <a href={account.sheetUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "3px 8px", borderRadius: 8, border: "1px solid var(--color-border-tertiary)", fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", textDecoration: "none" }}>シート↗</a>
        </div>
      </div>

      {/* Batch switcher (if more than 8) */}
      {posts.length > 8 && (
        <div style={{ display: "flex", marginBottom: 8, background: "var(--color-background-secondary)", borderRadius: 10, padding: 3 }}>
          {[{ id: "1", l: "1-8", n: batch1.length }, { id: "2", l: "9-16", n: batch2.length }].map(b => (
            <button key={b.id} onClick={() => { setBatch(b.id); setFilter("all"); }} style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: batch === b.id ? 600 : 400, background: batch === b.id ? "var(--color-background-primary)" : "transparent", border: "none", color: batch === b.id ? "var(--color-text-primary)" : "var(--color-text-tertiary)", cursor: "pointer", fontFamily: "inherit" }}>
              No.{b.l} ({b.n})
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <ProgressMeter posts={currentPosts} />

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: 10, gap: 0, borderBottom: "1.5px solid var(--color-border-tertiary)" }}>
        {[{ id: "overview", l: "⚡ アクション" }, { id: "posts", l: "📋 投稿管理" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-tertiary)", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid var(--color-text-primary)" : "2px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: -1.5 }}>{t.l}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <ActionPanel posts={currentPosts} onNavigate={(no) => { setTab("posts"); setFilter("all"); setOpenPostNo(no); }} />}
      {tab === "posts" && (
        <div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {[
              { id: "all", l: "すべて", n: currentPosts.length },
              { id: "review", l: "確認待ち", n: review, c: "#E2622E", bg: "#FDF0EB" },
              { id: "production", l: "制作中", n: production, c: "#C98118", bg: "#FDF3E2" },
              { id: "fb", l: "FB", n: fb, c: "#D4500A", bg: "#FDE8DE" },
              { id: "done", l: "完了", n: done, c: "#18B07A", bg: "#E4F8F0" },
            ].filter(f => f.n > 0 || f.id === "all").map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "3px 10px", borderRadius: 16, fontSize: 10, fontWeight: filter === f.id ? 600 : 400, border: filter === f.id ? "none" : "1px solid var(--color-border-tertiary)", background: filter === f.id ? (f.bg || "var(--color-text-primary)") : "var(--color-background-primary)", color: filter === f.id ? (f.c || "#fff") : "var(--color-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>{f.l}({f.n})</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(p => <PostCard key={p.no} post={p} onAction={handleAction} defaultOpen={openPostNo === p.no} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Main App ═══════════════════ */
export default function App() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", fontFamily: "'Noto Sans JP', sans-serif", padding: "0 8px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`* { -webkit-font-smoothing: antialiased; } ::selection { background: #7C6BF030; }`}</style>

      {/* Global Header */}
      <FadeIn>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingTop: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#833AB4,#E1306C,#F77737)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700, boxShadow: "0 3px 12px rgba(225,48,108,0.25)" }}>IG</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Becky Lash Tokyo</h1>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>フィード投稿管理 · 集客 & 採用</div>
          </div>
        </div>
      </FadeIn>

      {/* Two accounts side by side */}
      <FadeIn delay={100}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <Card style={{ flex: 1, padding: "16px 18px", minWidth: 0 }}>
            <AccountSection account={ACCOUNTS.attract} />
          </Card>
          <Card style={{ flex: 1, padding: "16px 18px", minWidth: 0 }}>
            <AccountSection account={ACCOUNTS.recruit} />
          </Card>
        </div>
      </FadeIn>

      <div style={{ marginTop: 18, textAlign: "center", fontSize: 10, color: "var(--color-text-tertiary)", paddingBottom: 8 }}>1分ごとにシート自動同期 · 手動同期は ↻ ボタン</div>
    </div>
  );
}
