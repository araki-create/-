import { useState, useEffect, useCallback } from "react";

const SHEET_ID = "15oOCrgXEC_3mqZxtPlT4b47NZD9IbP1Zy-SkQ4ypn5M";
const GID = "91948294";
const REFRESH_MS = 60000;

function loadSheetData() {
  return new Promise((resolve, reject) => {
    const cbName = "_gvizCb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      script.remove();
    }

    window[cbName] = (resp) => {
      cleanup();
      if (resp.status === "error") return reject(new Error(resp.errors?.[0]?.message || "API error"));
      try {
        const rows = resp.table.rows;
        const cols = resp.table.cols;
        const data = rows.map(r => r.c.map(c => (c ? (c.f || (c.v != null ? String(c.v) : "")) : "")));
        resolve(data);
      } catch (e) { reject(e); }
    };

    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${cbName}&gid=${GID}`;
    script.onerror = () => { cleanup(); reject(new Error("script load failed")); };
    document.body.appendChild(script);
  });
}

function findColIdx(headerRow, keyword) {
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i] && headerRow[i].includes(keyword)) return i;
  }
  return -1;
}

function parseDate(s) {
  if (!s) return "";
  const m = s.match(/(\d{1,2})\/(\d{1,2})/);
  return m ? `2026-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}` : s;
}

function processRows(rows) {
  if (rows.length < 3) return [];
  const hdr = rows[1];
  const ci = {
    no: findColIdx(hdr, "No"),
    title: findColIdx(hdr, "タイトル"),
    type: findColIdx(hdr, "投稿形態"),
    date: findColIdx(hdr, "投稿日"),
    caption: findColIdx(hdr, "キャプション"),
    sozai: findColIdx(hdr, "素材格納"),
    irai: findColIdx(hdr, "依頼"),
    shokou: findColIdx(hdr, "初稿"),
    nouhin: findColIdx(hdr, "納品"),
  };

  const posts = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const no = r[ci.no] || "";
    const title = r[ci.title] || "";
    if (!no || !title || title === "・・・・・") continue;

    const rawType = r[ci.type] || "";
    const type = rawType.includes("リール") ? "リール" : "フィード";
    const dateStr = r[ci.date] || "";
    const caption = r[ci.caption] || "";

    // Derive status from workflow columns (date + status pairs)
    let status = "draft";
    const nouhinDate = ci.nouhin >= 0 ? r[ci.nouhin] : "";
    const shokouDate = ci.shokou >= 0 ? r[ci.shokou] : "";
    const iraiDate = ci.irai >= 0 ? r[ci.irai] : "";
    const sozaiDate = ci.sozai >= 0 ? r[ci.sozai] : "";

    // Check status columns (typically right after each date column)
    const nouhinSt = ci.nouhin >= 0 && r[ci.nouhin + 1] ? r[ci.nouhin + 1].trim() : "";
    const shokouSt = ci.shokou >= 0 && r[ci.shokou + 1] ? r[ci.shokou + 1].trim() : "";
    const iraiSt = ci.irai >= 0 && r[ci.irai + 1] ? r[ci.irai + 1].trim() : "";
    const sozaiSt = ci.sozai >= 0 && r[ci.sozai + 1] ? r[ci.sozai + 1].trim() : "";

    if (nouhinSt === "完了") status = "posted";
    else if (shokouSt === "完了") status = "approved";
    else if (iraiSt === "完了") status = "pending";
    else if (sozaiSt === "完了") status = "draft";

    posts.push({ id: `${i}-${no}`, no, title, type, scheduledDate: parseDate(dateStr), caption, status, feedback: "" });
  }
  return posts;
}

// ---- UI ----
const ST = {
  draft: { label: "下書き", color: "#8B8FA3", bg: "#F0F1F5" },
  pending: { label: "確認待ち", color: "#D97706", bg: "#FEF3C7" },
  approved: { label: "承認済み", color: "#059669", bg: "#D1FAE5" },
  rejected: { label: "差し戻し", color: "#DC2626", bg: "#FEE2E2" },
  posted: { label: "投稿済み", color: "#7C3AED", bg: "#EDE9FE" },
};
const fmtDate = (d) => { try { const x = new Date(d+"T00:00:00"); return isNaN(x) ? d : `${x.getMonth()+1}/${x.getDate()}（${["日","月","火","水","木","金","土"][x.getDay()]}）`; } catch { return d; } };
const isToday = (d) => { try { return new Date().toDateString() === new Date(d+"T00:00:00").toDateString(); } catch { return false; } };

function Badge({ status }) {
  const c = ST[status] || ST.draft;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:600, color:c.color, background:c.bg, whiteSpace:"nowrap" }}><span style={{ width:6, height:6, borderRadius:"50%", background:c.color }}/>{c.label}</span>;
}
function TBadge({ type }) {
  const r = type === "リール";
  return <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5, background:r?"#FFF7ED":"#F0FDF4", color:r?"#EA580C":"#16A34A", border:r?"1px solid #FED7AA":"1px solid #BBF7D0" }}>{r?"🎬 リール":"📷 フィード"}</span>;
}

function Detail({ post, onClose, mode, onApprove, onReject, onFB }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", maxWidth:640, width:"100%", maxHeight:"85vh", overflow:"auto", animation:"su .3s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"16px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, flex:1, paddingRight:8 }}>{post.title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9CA3AF", padding:4 }}>✕</button>
        </div>
        <div style={{ padding:"12px 20px 24px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
            <Badge status={post.status}/><TBadge type={post.type}/><span style={{ fontSize:12, color:"#6E6A7C" }}>{fmtDate(post.scheduledDate)}</span>
          </div>
          {post.caption ? (
            <div><div style={{ fontSize:11, fontWeight:700, color:"#6E6A7C", marginBottom:6 }}>キャプション</div>
            <div style={{ background:"#F9FAFB", borderRadius:12, padding:"14px 16px", fontSize:13, lineHeight:1.8, color:"#1A1625", whiteSpace:"pre-wrap", border:"1px solid #E8E6F0" }}>{post.caption}</div></div>
          ) : <div style={{ background:"#F9FAFB", borderRadius:12, padding:"24px 16px", textAlign:"center", color:"#9CA3AF", fontSize:13, border:"1px dashed #D1D5DB" }}>キャプション未設定</div>}
          {mode === "client" && post.status === "pending" && (
            <div style={{ marginTop:16 }}>
              <textarea value={post.feedback} onChange={e=>onFB(post.id,e.target.value)} placeholder="フィードバック（任意）" style={{ width:"100%", minHeight:60, padding:"10px 14px", borderRadius:10, border:"1px solid #E8E6F0", background:"#fff", fontSize:13, color:"#1A1625", resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
              <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                <button onClick={()=>{onReject(post.id);onClose();}} style={{ padding:"10px 22px", borderRadius:10, border:"1px solid #FECACA", background:"#FEF2F2", color:"#DC2626", fontSize:14, fontWeight:600, cursor:"pointer" }}>差し戻す</button>
                <button onClick={()=>{onApprove(post.id);onClose();}} style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#6366F1", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>承認する</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function Card({ post, onOpen }) {
  const today = isToday(post.scheduledDate);
  return (
    <div onClick={()=>onOpen(post)} style={{ background:"#fff", borderRadius:14, overflow:"hidden", cursor:"pointer", border:today?"2px solid #A78BFA":"1px solid #E8E6F0", position:"relative" }}>
      {today && <div style={{ position:"absolute", top:0, right:14, background:"#7C3AED", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px 3px", borderRadius:"0 0 5px 5px", zIndex:2 }}>TODAY</div>}
      <div style={{ display:"flex" }}>
        <div style={{ width:56, flexShrink:0, background:post.type==="リール"?"linear-gradient(135deg,#FFF7ED,#FFEDD5)":"linear-gradient(135deg,#F3E8FF,#EDE9FE)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:20, opacity:0.6 }}>{post.type==="リール"?"🎬":"📷"}</span>
        </div>
        <div style={{ flex:1, padding:"10px 14px", minWidth:0 }}>
          <h3 style={{ margin:"0 0 5px", fontSize:13, fontWeight:700, color:"#1A1625", lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.title}</h3>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <Badge status={post.status}/><TBadge type={post.type}/>
            <span style={{ fontSize:11, color:today?"#7C3AED":"#6E6A7C", fontWeight:today?600:400 }}>{fmtDate(post.scheduledDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, visible }) {
  return <div style={{ position:"fixed", bottom:visible?32:-60, left:"50%", transform:"translateX(-50%)", background:"#1F2937", color:"#fff", padding:"12px 24px", borderRadius:12, fontSize:14, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.2)", transition:"bottom .35s cubic-bezier(.4,0,.2,1)", zIndex:999, whiteSpace:"nowrap" }}>{message}</div>;
}

export default function App() {
  const [mode, setMode] = useState("manager");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [toast, setToast] = useState({ message:"", visible:false });
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState("all");

  const showToast = (m) => { setToast({ message:m, visible:true }); setTimeout(()=>setToast(t=>({...t,visible:false})),2500); };

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const rows = await loadSheetData();
      const newPosts = processRows(rows);
      setPosts(prev => {
        const ov = {};
        prev.forEach(p => { if (p._lo) ov[p.id] = { status:p.status, feedback:p.feedback, _lo:true }; });
        return newPosts.map(p => ov[p.id] ? { ...p, ...ov[p.id] } : p);
      });
      setLastSync(new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"}));
    } catch (e) {
      console.error(e);
      setError("接続エラー: " + e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const id = setInterval(fetchData, REFRESH_MS); return ()=>clearInterval(id); }, [fetchData]);

  const fp = posts.filter(p => {
    if (mode === "client") return ["pending","approved","rejected"].includes(p.status);
    return filter === "all" || p.status === filter;
  });
  const pp = fp.filter(p=>p.status==="pending");
  const sc = { all:posts.length, draft:posts.filter(p=>p.status==="draft").length, pending:posts.filter(p=>p.status==="pending").length, approved:posts.filter(p=>p.status==="approved").length, posted:posts.filter(p=>p.status==="posted").length };

  return (
    <div style={{ "--accent":"#6366F1", fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif", minHeight:"100vh", background:"#FAFAFE", color:"#1A1625" }}>
      <header style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid #E8E6F0", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:640, margin:"0 auto", padding:"0 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(99,102,241,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 2.5L6.5 13.5L4.5 8L1.5 6.5L13.5 2.5Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/></svg>
              </div>
              <div><span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.03em" }}>PostFlow</span><span style={{ fontSize:10, color:"#6E6A7C", marginLeft:8, fontWeight:500 }}>Becky Lash Tokyo</span></div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={fetchData} disabled={loading} title="同期" style={{ width:32, height:32, borderRadius:8, border:"1px solid #E8E6F0", background:"#fff", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="#6E6A7C" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 0.5V4.5L11 2.5" fill="#6E6A7C"/></svg>
              </button>
              <div style={{ display:"flex", background:"#F1F0F7", borderRadius:9, padding:3 }}>
                {[{k:"manager",l:"運用側"},{k:"client",l:"クライアント"}].map(m=>(
                  <button key={m.k} onClick={()=>{setMode(m.k);setFilter("all");}} style={{ padding:"5px 14px", borderRadius:7, border:"none", background:mode===m.k?"#fff":"transparent", color:mode===m.k?"#1A1625":"#6E6A7C", fontSize:12, fontWeight:600, cursor:"pointer", boxShadow:mode===m.k?"0 1px 4px rgba(0,0,0,0.06)":"none" }}>{m.l}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingBottom:8, fontSize:11, color:error?"#DC2626":"#6E6A7C", display:"flex", alignItems:"center", gap:6 }}>
            {loading ? <><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", border:"2px solid #6366F1", borderTopColor:"transparent", animation:"sp .8s linear infinite" }}/>同期中...</>
            : error ? <><span>⚠</span>{error}</>
            : lastSync ? <><span style={{ width:6, height:6, borderRadius:"50%", background:"#059669", display:"inline-block" }}/>最終同期: {lastSync} · {posts.length}件</>
            : null}
            <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:640, margin:"0 auto", padding:"16px 16px 120px" }}>
        {mode === "manager" && <>
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {[{k:"all",l:`すべて (${sc.all})`},{k:"draft",l:`下書き (${sc.draft})`},{k:"pending",l:`確認待ち (${sc.pending})`},{k:"approved",l:`承認済み (${sc.approved})`},{k:"posted",l:`投稿済み (${sc.posted})`}].map(s=>(
              <button key={s.k} onClick={()=>setFilter(s.k)} style={{ padding:"5px 12px", borderRadius:8, border:filter===s.k?"1px solid #6366F1":"1px solid #E8E6F0", background:filter===s.k?"#EEF2FF":"#fff", color:filter===s.k?"#6366F1":"#6E6A7C", fontSize:11, fontWeight:600, cursor:"pointer" }}>{s.l}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {fp.map(p=><Card key={p.id} post={p} onOpen={setDetail}/>)}
            {!loading && fp.length===0 && <div style={{ textAlign:"center", padding:"48px 20px", color:"#6E6A7C", fontSize:14 }}>{posts.length===0?"スプレッドシートからデータを読み込んでいます...":"該当する投稿がありません"}</div>}
          </div>
        </>}

        {mode === "client" && <>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800 }}>投稿の確認・承認</h2>
            <p style={{ margin:0, fontSize:13, color:"#6E6A7C", lineHeight:1.5 }}>内容をご確認のうえ、承認または差し戻しをお選びください。</p>
          </div>
          {fp.length===0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px", color:"#6E6A7C" }}>
              <div style={{ fontSize:36, marginBottom:10, opacity:0.6 }}>✓</div>
              <div style={{ fontSize:15, fontWeight:600 }}>確認待ちの投稿はありません</div>
              <div style={{ fontSize:12, marginTop:4 }}>スプレッドシートが更新されると自動で反映されます</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {fp.map(p=><Card key={p.id} post={p} onOpen={setDetail}/>)}
            </div>
          )}
        </>}
      </main>

      {detail && <Detail post={detail} mode={mode} onClose={()=>setDetail(null)}
        onApprove={id=>{setPosts(p=>p.map(x=>x.id===id?{...x,status:"approved",_lo:true}:x));showToast("承認しました ✓");}}
        onReject={id=>{setPosts(p=>p.map(x=>x.id===id?{...x,status:"rejected",_lo:true}:x));showToast("差し戻しました");}}
        onFB={(id,fb)=>setPosts(p=>p.map(x=>x.id===id?{...x,feedback:fb}:x))}
      />}
      <Toast message={toast.message} visible={toast.visible}/>
    </div>
  );
}
