import { useState, useEffect, useCallback } from "react";

const SHEET_ID = "15oOCrgXEC_3mqZxtPlT4b47NZD9IbP1Zy-SkQ4ypn5M";
const GID = "91948294"; // フィード投稿管理
const FETCH_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
const REFRESH_INTERVAL = 60000; // 60秒

// Parse Google Visualization API JSONP response
function parseGvizResponse(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?\s*$/);
  if (!match) throw new Error("Invalid response format");
  return JSON.parse(match[1]);
}

// Extract cell value from gviz cell object
function cellVal(cell) {
  if (!cell) return "";
  if (cell.f) return cell.f; // formatted value
  if (cell.v === null || cell.v === undefined) return "";
  return String(cell.v);
}

// Find column index by header text (partial match)
function findCol(cols, rows, keyword) {
  // Check row 1 (header row, index 1) for column names
  if (rows.length > 1) {
    const headerRow = rows[1]?.c || [];
    for (let i = 0; i < headerRow.length; i++) {
      const val = cellVal(headerRow[i]);
      if (val && val.includes(keyword)) return i;
    }
  }
  // Fallback: check col labels
  for (let i = 0; i < cols.length; i++) {
    if (cols[i].label && cols[i].label.includes(keyword)) return i;
  }
  return -1;
}

// Derive status from workflow columns
function deriveStatus(row, colMap) {
  const getNorm = (idx) => idx >= 0 ? cellVal(row[idx]).trim() : "";

  // Check 納品 status column (column after 納品 date)
  const nouhinStatus = getNorm(colMap.nouhinStatus);
  const shokouStatus = getNorm(colMap.shokouStatus);
  const iraiStatus = getNorm(colMap.iraiStatus);

  if (nouhinStatus === "完了") return "posted";
  if (shokouStatus === "完了") return "pending";
  if (iraiStatus === "完了") return "approved";
  
  // Check if 素材格納 is done
  const sozaiStatus = getNorm(colMap.sozaiStatus);
  if (sozaiStatus === "完了") return "draft";
  
  return "draft";
}

// Convert MM/DD date string to full date
function parseDate(dateStr) {
  if (!dateStr) return "";
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return dateStr;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `2026-${month}-${day}`;
}

// Process fetched data into post objects
function processSheetData(data) {
  const { cols, rows } = data.table;
  
  // Find columns by header name (row index 1)
  const colMap = {
    no: findCol(cols, rows, "No"),
    title: findCol(cols, rows, "タイトル"),
    type: findCol(cols, rows, "投稿形態"),
    date: findCol(cols, rows, "投稿日"),
    caption: findCol(cols, rows, "キャプション"),
    sozai: findCol(cols, rows, "素材格納"),
    irai: findCol(cols, rows, "依頼"),
    shokou: findCol(cols, rows, "初稿"),
    nouhin: findCol(cols, rows, "納品"),
  };

  // Status columns are typically the column right after each date column
  colMap.sozaiStatus = colMap.sozai >= 0 ? colMap.sozai + 1 : -1;
  colMap.iraiStatus = colMap.irai >= 0 ? colMap.irai + 1 : -1;
  colMap.shokouStatus = colMap.shokou >= 0 ? colMap.shokou + 1 : -1;
  colMap.nouhinStatus = colMap.nouhin >= 0 ? colMap.nouhin + 1 : -1;

  const posts = [];
  
  // Skip header rows (0=empty, 1=headers, 2=template), data starts at row 3
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i]?.c;
    if (!row) continue;
    
    const no = cellVal(row[colMap.no]);
    const title = cellVal(row[colMap.title]);
    
    if (!no || !title || title === "・・・・・") continue;
    
    const rawType = cellVal(row[colMap.type]);
    const type = rawType.includes("リール") ? "リール" : "フィード";
    const dateStr = cellVal(row[colMap.date]);
    const caption = cellVal(row[colMap.caption]);
    const status = deriveStatus(row, colMap);
    
    posts.push({
      id: `${i}-${no}`,
      no,
      title,
      type,
      scheduledDate: parseDate(dateStr),
      rawDate: dateStr,
      caption,
      status,
      feedback: "",
    });
  }
  
  return posts;
}

// ---- UI Components ----

const STATUS_CONFIG = {
  draft: { label: "下書き", color: "#8B8FA3", bg: "#F0F1F5" },
  pending: { label: "確認待ち", color: "#D97706", bg: "#FEF3C7" },
  approved: { label: "承認済み", color: "#059669", bg: "#D1FAE5" },
  rejected: { label: "差し戻し", color: "#DC2626", bg: "#FEE2E2" },
  posted: { label: "投稿済み", color: "#7C3AED", bg: "#EDE9FE" },
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const x = new Date(d + "T00:00:00");
    if (isNaN(x)) return d;
    return `${x.getMonth() + 1}/${x.getDate()}（${["日","月","火","水","木","金","土"][x.getDay()]}）`;
  } catch { return d; }
};

const isToday = (d) => {
  try { return new Date().toDateString() === new Date(d + "T00:00:00").toDateString(); } 
  catch { return false; }
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:600, color:c.color, background:c.bg, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color }} />{c.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const r = type === "リール";
  return (
    <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5, background:r?"#FFF7ED":"#F0FDF4", color:r?"#EA580C":"#16A34A", border:r?"1px solid #FED7AA":"1px solid #BBF7D0" }}>
      {r ? "🎬 リール" : "📷 フィード"}
    </span>
  );
}

function PostDetail({ post, onClose, mode, onApprove, onReject, onFeedbackChange }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", maxWidth:640, width:"100%", maxHeight:"85vh", overflow:"auto", animation:"slideUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"16px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, flex:1, paddingRight:8 }}>{post.title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#9CA3AF", padding:4, flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:"12px 20px 24px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
            <StatusBadge status={post.status} />
            <TypeBadge type={post.type} />
            <span style={{ fontSize:12, color:"#6E6A7C" }}>{formatDate(post.scheduledDate)}</span>
          </div>

          {post.caption ? (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#6E6A7C", marginBottom:6 }}>キャプション</div>
              <div style={{ background:"#F9FAFB", borderRadius:12, padding:"14px 16px", fontSize:13, lineHeight:1.8, color:"#1A1625", whiteSpace:"pre-wrap", border:"1px solid #E8E6F0" }}>
                {post.caption}
              </div>
            </div>
          ) : (
            <div style={{ background:"#F9FAFB", borderRadius:12, padding:"24px 16px", textAlign:"center", color:"#9CA3AF", fontSize:13, border:"1px dashed #D1D5DB" }}>
              キャプション未設定
            </div>
          )}
          
          {mode === "client" && post.status === "pending" && (
            <div style={{ marginTop:16 }}>
              <textarea value={post.feedback} onChange={e => onFeedbackChange(post.id, e.target.value)} placeholder="フィードバックがあれば入力（任意）"
                style={{ width:"100%", minHeight:60, padding:"10px 14px", borderRadius:10, border:"1px solid #E8E6F0", background:"#fff", fontSize:13, color:"#1A1625", resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
              <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                <button onClick={() => { onReject(post.id); onClose(); }} style={{ padding:"10px 22px", borderRadius:10, border:"1px solid #FECACA", background:"#FEF2F2", color:"#DC2626", fontSize:14, fontWeight:600, cursor:"pointer" }}>差し戻す</button>
                <button onClick={() => { onApprove(post.id); onClose(); }} style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#6366F1", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>承認する</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

function PostCard({ post, onOpen }) {
  const today = isToday(post.scheduledDate);
  return (
    <div onClick={() => onOpen(post)} style={{
      background:"#fff", borderRadius:14, overflow:"hidden", cursor:"pointer",
      border: today ? "2px solid #A78BFA" : "1px solid #E8E6F0",
      transition:"all 0.2s", position:"relative",
    }}>
      {today && <div style={{ position:"absolute", top:0, right:14, background:"#7C3AED", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px 3px", borderRadius:"0 0 5px 5px", zIndex:2 }}>TODAY</div>}
      <div style={{ display:"flex", gap:0 }}>
        <div style={{ width:60, flexShrink:0, background: post.type === "リール" ? "linear-gradient(135deg,#FFF7ED,#FFEDD5)" : "linear-gradient(135deg,#F3E8FF,#EDE9FE)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:22, opacity:0.6 }}>{post.type === "リール" ? "🎬" : "📷"}</span>
        </div>
        <div style={{ flex:1, padding:"10px 14px", minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:6, marginBottom:5 }}>
            <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:"#1A1625", lineHeight:1.35, flex:1, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{post.title}</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <StatusBadge status={post.status} />
            <TypeBadge type={post.type} />
            <span style={{ fontSize:11, color: today ? "#7C3AED" : "#6E6A7C", fontWeight: today ? 600 : 400 }}>
              {formatDate(post.scheduledDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, visible }) {
  return <div style={{ position:"fixed", bottom: visible ? 32 : -60, left:"50%", transform:"translateX(-50%)", background:"#1F2937", color:"#fff", padding:"12px 24px", borderRadius:12, fontSize:14, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.2)", transition:"bottom 0.35s cubic-bezier(.4,0,.2,1)", zIndex:999, whiteSpace:"nowrap" }}>{message}</div>;
}

function SyncIndicator({ loading, lastSync, error }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color: error ? "#DC2626" : "#6E6A7C" }}>
      {loading ? (
        <><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", border:"2px solid #6366F1", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />同期中...</>
      ) : error ? (
        <><span style={{ color:"#DC2626" }}>⚠</span>{error}</>
      ) : lastSync ? (
        <><span style={{ width:6, height:6, borderRadius:"50%", background:"#059669", display:"inline-block" }} />最終同期: {lastSync}</>
      ) : null}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ---- Main App ----

export default function App() {
  const [mode, setMode] = useState("manager");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [toast, setToast] = useState({ message:"", visible:false });
  const [detailPost, setDetailPost] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [approveAllMode, setApproveAllMode] = useState(false);

  const showToast = (m) => { setToast({ message:m, visible:true }); setTimeout(() => setToast(t => ({ ...t, visible:false })), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(FETCH_URL);
      const text = await res.text();
      const data = parseGvizResponse(text);
      const newPosts = processSheetData(data);
      
      // Preserve local overrides (rejected/approved by client in this session)
      setPosts(prev => {
        const overrides = {};
        prev.forEach(p => {
          if (p._localOverride) overrides[p.id] = { status: p.status, feedback: p.feedback, _localOverride: true };
        });
        return newPosts.map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p);
      });
      
      const now = new Date();
      setLastSync(`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`);
    } catch (e) {
      console.error("Fetch error:", e);
      setError("スプレッドシートに接続できません");
      // If first load, set empty
      setPosts(prev => prev.length === 0 ? [] : prev);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredPosts = posts.filter(p => {
    if (mode === "client") return ["pending","approved","rejected"].includes(p.status);
    return statusFilter === "all" || p.status === statusFilter;
  });

  const pendingPosts = filteredPosts.filter(p => p.status === "pending");

  const sc = { all:posts.length, draft:posts.filter(p=>p.status==="draft").length, pending:posts.filter(p=>p.status==="pending").length, approved:posts.filter(p=>p.status==="approved").length, rejected:posts.filter(p=>p.status==="rejected").length, posted:posts.filter(p=>p.status==="posted").length };

  const handleApprove = (id) => {
    setPosts(p => p.map(x => x.id === id ? { ...x, status:"approved", _localOverride:true } : x));
    showToast("承認しました ✓");
  };
  const handleReject = (id) => {
    setPosts(p => p.map(x => x.id === id ? { ...x, status:"rejected", _localOverride:true } : x));
    showToast("差し戻しました");
  };
  const handleFeedbackChange = (id, fb) => {
    setPosts(p => p.map(x => x.id === id ? { ...x, feedback:fb } : x));
  };

  return (
    <div style={{ "--accent":"#6366F1", fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif", minHeight:"100vh", background:"#FAFAFE", color:"#1A1625" }}>
      {/* Header */}
      <header style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid #E8E6F0", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:640, margin:"0 auto", padding:"0 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(99,102,241,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 2.5L6.5 13.5L4.5 8L1.5 6.5L13.5 2.5Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.03em" }}>PostFlow</span>
                <span style={{ fontSize:10, color:"#6E6A7C", marginLeft:8, fontWeight:500 }}>Becky Lash Tokyo</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={fetchData} disabled={loading} title="手動同期" style={{ width:32, height:32, borderRadius:8, border:"1px solid #E8E6F0", background:"#fff", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: loading ? "rotate(360deg)" : "none", transition:"transform 0.6s" }}>
                  <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="#6E6A7C" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 0.5V4.5L11 2.5" fill="#6E6A7C"/>
                </svg>
              </button>
              <div style={{ display:"flex", background:"#F1F0F7", borderRadius:9, padding:3 }}>
                {[{key:"manager",label:"運用側"},{key:"client",label:"クライアント"}].map(m => (
                  <button key={m.key} onClick={() => { setMode(m.key); setStatusFilter("all"); }}
                    style={{ padding:"5px 14px", borderRadius:7, border:"none", background:mode===m.key?"#fff":"transparent", color:mode===m.key?"#1A1625":"#6E6A7C", fontSize:12, fontWeight:600, cursor:"pointer", boxShadow:mode===m.key?"0 1px 4px rgba(0,0,0,0.06)":"none", transition:"all 0.2s" }}>{m.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingBottom:8 }}>
            <SyncIndicator loading={loading} lastSync={lastSync} error={error} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth:640, margin:"0 auto", padding:"16px 16px 120px" }}>
        {/* Error state with setup instructions */}
        {error && posts.length === 0 && (
          <div style={{ background:"#FEF2F2", borderRadius:14, padding:"20px", marginBottom:16, border:"1px solid #FECACA" }}>
            <h3 style={{ margin:"0 0 8px", fontSize:15, fontWeight:700, color:"#991B1B" }}>スプレッドシートに接続できません</h3>
            <p style={{ margin:"0 0 12px", fontSize:13, color:"#B91C1C", lineHeight:1.6 }}>
              以下の手順で設定してください：
            </p>
            <ol style={{ margin:0, paddingLeft:20, fontSize:13, color:"#991B1B", lineHeight:2 }}>
              <li>Googleスプレッドシートを開く</li>
              <li>ファイル → 共有 → 「ウェブに公開」</li>
              <li>「フィード投稿管理」シートを選択して公開</li>
              <li>このアプリを再読み込み</li>
            </ol>
          </div>
        )}

        {/* Manager view */}
        {mode === "manager" && <>
          {/* Status filter */}
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {[{k:"all",l:`すべて (${sc.all})`},{k:"draft",l:`下書き (${sc.draft})`},{k:"pending",l:`確認待ち (${sc.pending})`},{k:"approved",l:`承認済み (${sc.approved})`},{k:"posted",l:`投稿済み (${sc.posted})`}].map(s => (
              <button key={s.k} onClick={() => setStatusFilter(s.k)} style={{ padding:"5px 12px", borderRadius:8, border:statusFilter===s.k?"1px solid #6366F1":"1px solid #E8E6F0", background:statusFilter===s.k?"#EEF2FF":"#fff", color:statusFilter===s.k?"#6366F1":"#6E6A7C", fontSize:11, fontWeight:600, cursor:"pointer" }}>{s.l}</button>
            ))}
          </div>

          {/* Post list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filteredPosts.map(p => <PostCard key={p.id} post={p} onOpen={setDetailPost} />)}
            {!loading && filteredPosts.length === 0 && (
              <div style={{ textAlign:"center", padding:"48px 20px", color:"#6E6A7C", fontSize:14 }}>
                {posts.length === 0 ? "データを読み込んでいます..." : "該当する投稿がありません"}
              </div>
            )}
          </div>
        </>}

        {/* Client view */}
        {mode === "client" && <>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800 }}>投稿の確認・承認</h2>
            <p style={{ margin:0, fontSize:13, color:"#6E6A7C", lineHeight:1.5 }}>内容をご確認のうえ、承認または差し戻しをお選びください。</p>
          </div>

          {pendingPosts.length > 1 && (
            <div style={{ marginBottom:14 }}>
              {!approveAllMode ? (
                <button onClick={() => setApproveAllMode(true)} style={{ width:"100%", padding:"13px", borderRadius:12, border:"2px dashed #6366F1", background:"rgba(99,102,241,0.04)", color:"#6366F1", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  すべて一括承認する（{pendingPosts.length}件）
                </button>
              ) : (
                <div style={{ padding:"12px 14px", borderRadius:12, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#3730A3" }}>{pendingPosts.length}件すべて承認しますか？</span>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setApproveAllMode(false)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #C7D2FE", background:"#fff", color:"#3730A3", fontSize:12, fontWeight:600, cursor:"pointer" }}>キャンセル</button>
                    <button onClick={() => { pendingPosts.forEach(p => handleApprove(p.id)); setApproveAllMode(false); showToast("すべて承認しました ✓"); }} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#6366F1", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>一括承認</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px", color:"#6E6A7C" }}>
              <div style={{ fontSize:36, marginBottom:10, opacity:0.6 }}>✓</div>
              <div style={{ fontSize:15, fontWeight:600 }}>確認待ちの投稿はありません</div>
              <div style={{ fontSize:12, marginTop:4 }}>スプレッドシートが更新されると自動で反映されます</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredPosts.map(p => <PostCard key={p.id} post={p} onOpen={setDetailPost} />)}
            </div>
          )}
        </>}
      </main>

      {detailPost && (
        <PostDetail
          post={detailPost}
          mode={mode}
          onClose={() => setDetailPost(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onFeedbackChange={handleFeedbackChange}
        />
      )}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
