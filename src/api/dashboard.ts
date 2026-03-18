import type { ServerConfig } from "../types/index.js";

function baseUrl(config: ServerConfig): string {
  return `http://${config.host}:${config.port}`;
}

function layout(title: string, nav: string, body: string, config: ServerConfig): string {
  const base = baseUrl(config);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — ContentClaw</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0b;--surface:#141417;--surface2:#1c1c21;--border:#2a2a30;
    --text:#e4e4e7;--text2:#a1a1aa;--accent:#f97316;--accent2:#fb923c;
    --green:#22c55e;--red:#ef4444;--yellow:#eab308;--orange:#f97316;
    --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    --mono:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;
  }
  body{font-family:var(--font);background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
  a{color:var(--accent);text-decoration:none}
  a:hover{color:var(--accent2)}

  .topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;display:flex;align-items:center;height:56px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
  .topbar .logo{font-weight:700;font-size:18px;color:var(--accent);letter-spacing:1px;margin-right:8px}
  .topbar .sig{color:var(--text2);font-size:12px;margin-right:auto}
  .topbar nav{display:flex;gap:4px}
  .topbar nav a{padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;color:var(--text2);transition:all .15s}
  .topbar nav a:hover,.topbar nav a.active{background:var(--surface2);color:var(--text)}

  .container{max-width:1200px;margin:0 auto;padding:32px 24px}

  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px}
  .stat-card .label{font-size:13px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .stat-card .value{font-size:28px;font-weight:700;color:var(--text)}
  .stat-card .value.accent{color:var(--accent)}

  .section-title{font-size:20px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:12px}
  .section-title .badge{font-size:12px;background:var(--surface2);color:var(--text2);padding:2px 10px;border-radius:20px;font-weight:500}

  .pages-grid{display:flex;flex-direction:column;gap:12px}
  .page-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;transition:border-color .15s;cursor:pointer;position:relative}
  .page-card:hover{border-color:var(--accent)}
  .page-card .page-title{font-size:16px;font-weight:600;margin-bottom:6px;color:var(--text)}
  .page-card .page-meta{font-size:13px;color:var(--text2);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .page-card .page-tags{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .page-card .tag{font-size:11px;padding:3px 10px;border-radius:20px;background:var(--surface2);color:var(--text2);font-weight:500}
  .page-card .tag.slug{color:var(--accent)}
  .page-card .delete-btn{position:absolute;top:16px;right:16px;background:none;border:1px solid var(--border);color:var(--text2);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s;opacity:0}
  .page-card:hover .delete-btn{opacity:1}
  .page-card .delete-btn:hover{border-color:var(--red);color:var(--red);background:rgba(239,68,68,.1)}

  .empty{text-align:center;padding:80px 24px;color:var(--text2)}
  .empty h3{font-size:18px;margin-bottom:8px;color:var(--text)}
  .empty code{background:var(--surface2);padding:3px 8px;border-radius:6px;font-family:var(--mono);font-size:13px}

  .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
  .modal-overlay.open{display:flex}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:90%;max-width:800px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column}
  .modal-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .modal-header h2{font-size:18px;font-weight:600}
  .modal-close{background:none;border:none;color:var(--text2);cursor:pointer;font-size:20px;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .modal-close:hover{background:var(--surface2);color:var(--text)}
  .modal-body{padding:24px;overflow-y:auto;flex:1}
  .modal-body .field{margin-bottom:16px}
  .modal-body .field-label{font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .modal-body .field-value{font-size:14px;color:var(--text)}
  .modal-body .field-value.meta{color:var(--text2);font-style:italic}
  .modal-body .body-preview{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;font-size:14px;line-height:1.7;max-height:400px;overflow-y:auto}
  .modal-body .body-preview h2{font-size:18px;margin:16px 0 8px;color:var(--accent)}
  .modal-body .body-preview h3{font-size:16px;margin:12px 0 6px;color:var(--text)}
  .modal-body .body-preview p{margin-bottom:12px;color:var(--text2)}
  .modal-body .body-preview ul,.modal-body .body-preview ol{margin:8px 0 12px 20px;color:var(--text2)}
  .modal-body .body-preview a{color:var(--accent)}

  .refresh-btn{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;display:flex;align-items:center;gap:6px}
  .refresh-btn:hover{border-color:var(--accent);color:var(--accent)}
  .refresh-btn.spinning svg{animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  .toast{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 20px;font-size:14px;z-index:300;transform:translateY(100px);opacity:0;transition:all .3s}
  .toast.show{transform:translateY(0);opacity:1}
  .toast.success{border-color:var(--green);color:var(--green)}
  .toast.error{border-color:var(--red);color:var(--red)}

  .live-dot{display:inline-block;transition:opacity .3s}
  .live-dot.pulse{animation:livePulse .6s ease-in-out}
  @keyframes livePulse{0%{opacity:1}50%{opacity:.3}100%{opacity:1}}
</style>
</head>
<body>
<div class="topbar">
  <span class="logo">ContentClaw</span>
  <span class="sig">by metehan.ai</span>
  <nav>${nav}</nav>
</div>
${body}
<div id="toast" class="toast"></div>
<script>
  const BASE='${base}';
  function toast(msg,type='success'){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;setTimeout(()=>t.className='toast',3000)}
</script>
</body>
</html>`;
}

export function dashboardPage(config: ServerConfig): string {
  const nav = `<a href="/" class="active">Dashboard</a><a href="/docs">API Docs</a><a href="/experts">Follow SEO Experts</a>`;
  const body = `
<div class="container">
  <div class="stats">
    <div class="stat-card"><div class="label">Total Pages</div><div class="value accent" id="totalPages">—</div></div>
    <div class="stat-card"><div class="label">Server</div><div class="value" style="font-size:16px;color:var(--green)"><span id="liveDot" class="live-dot">●</span> Live</div></div>
    <div class="stat-card"><div class="label">API Base</div><div class="value" style="font-size:14px;color:var(--text2)">${baseUrl(config)}/api</div></div>
  </div>

  <div style="background:linear-gradient(135deg,rgba(234,179,8,.08),rgba(249,115,22,.08));border:1px solid rgba(234,179,8,.25);border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:20px;flex-shrink:0">⚠️</span>
    <div style="font-size:13px;color:var(--text2);line-height:1.6">
      <strong style="color:var(--yellow)">Content at scale - read before publishing.</strong>
      Publishing large volumes of AI-generated pages all at once can trigger Google quality filters or algorithm penalties. Your rankings may initially rise, then drop after an update. Publish gradually, review content before going live, add unique value (images, original data, experience), and monitor Search Console for manual actions.
      <a href="/experts" style="color:var(--accent);margin-left:4px">Follow SEO experts to stay updated →</a>
    </div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div class="section-title" style="margin-bottom:0">Pages <span class="badge" id="pageCount">0</span></div>
    <button class="refresh-btn" onclick="loadPages()" id="refreshBtn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
      Refresh
    </button>
  </div>

  <div class="pages-grid" id="pagesGrid">
    <div class="empty"><h3>Loading...</h3></div>
  </div>
</div>

<div class="modal-overlay" id="modalOverlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modalTitle">Page Details</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>

<script>
let allPages=[];
let prevTotal=0;

async function loadPages(silent){
  const btn=document.getElementById('refreshBtn');
  if(!silent)btn.classList.add('spinning');
  try{
    const r=await fetch(BASE+'/api/pages?limit=500');
    const d=await r.json();
    const newTotal=d.total||0;
    if(newTotal>prevTotal&&prevTotal>0){
      toast(newTotal-prevTotal+' new page(s) generated','success');
    }
    prevTotal=newTotal;
    allPages=d.data||[];
    document.getElementById('totalPages').textContent=newTotal;
    document.getElementById('pageCount').textContent=newTotal;
    renderPages(allPages);
    const dot=document.getElementById('liveDot');
    if(dot){dot.classList.add('pulse');setTimeout(()=>dot.classList.remove('pulse'),1000)}
  }catch(e){if(!silent)toast('Failed to load pages','error')}
  btn.classList.remove('spinning');
}

function renderPages(pages){
  const grid=document.getElementById('pagesGrid');
  if(!pages.length){
    grid.innerHTML='<div class="empty"><h3>No pages yet</h3><p>Run <code>contentclaw generate "your keyword"</code> to create pages</p></div>';
    return;
  }
  grid.innerHTML=pages.map(p=>{
    const date=new Date(p.created_at||p.published_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    return \`<div class="page-card" onclick="showPage('\${p.slug}')">
      <div class="page-title">\${esc(p.title)}</div>
      <div class="page-meta">\${esc(p.meta_description)}</div>
      <div class="page-tags">
        <span class="tag slug">/\${esc(p.slug)}</span>
        <span class="tag">\${esc(p.keyword)}</span>
        <span class="tag">\${esc(p.page_type||'blog')}</span>
        <span class="tag">\${date}</span>
        \${(p.internal_links||[]).length?'<span class="tag">'+p.internal_links.length+' internal</span>':''}
        \${(p.external_links||[]).length?'<span class="tag">'+p.external_links.length+' external</span>':''}
      </div>
      <button class="delete-btn" onclick="event.stopPropagation();deletePage('\${p.slug}')" title="Delete">&times;</button>
    </div>\`;
  }).join('');
}

function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML}

async function showPage(slug){
  try{
    const r=await fetch(BASE+'/api/pages/'+slug);
    const p=await r.json();
    document.getElementById('modalTitle').textContent=p.title;
    const links=(p.internal_links||[]).map(l=>'<a href="'+esc(l.url)+'">'+esc(l.anchor)+'</a>').join(', ');
    document.getElementById('modalBody').innerHTML=\`
      <div class="field"><div class="field-label">Slug</div><div class="field-value">/\${esc(p.slug)}</div></div>
      <div class="field"><div class="field-label">Keyword</div><div class="field-value">\${esc(p.keyword)}</div></div>
      <div class="field"><div class="field-label">Page Type</div><div class="field-value">\${esc(p.page_type||'blog')}</div></div>
      <div class="field"><div class="field-label">Meta Description</div><div class="field-value meta">\${esc(p.meta_description)}</div></div>
      <div class="field"><div class="field-label">Published</div><div class="field-value">\${new Date(p.published_date).toLocaleString()}</div></div>
      \${links?'<div class="field"><div class="field-label">Internal Links</div><div class="field-value">'+links+'</div></div>':''}
      \${(p.external_links||[]).length?'<div class="field"><div class="field-label">External Links</div><div class="field-value">'+(p.external_links||[]).map(l=>'<a href="'+esc(l.url)+'" target="_blank" rel="noopener">'+esc(l.anchor)+'</a>').join(', ')+'</div></div>':''}
      <div class="field"><div class="field-label">Content</div><div class="body-preview">\${p.body}</div></div>
    \`;
    document.getElementById('modalOverlay').classList.add('open');
  }catch(e){toast('Failed to load page','error')}
}

function closeModal(){document.getElementById('modalOverlay').classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

async function deletePage(slug){
  if(!confirm('Delete /'+slug+'?'))return;
  try{
    await fetch(BASE+'/api/pages/'+slug,{method:'DELETE'});
    toast('Deleted /'+slug);
    loadPages();
  }catch(e){toast('Delete failed','error')}
}

loadPages();
setInterval(()=>loadPages(true),3000);
</script>`;

  return layout("Dashboard", nav, body, config);
}

export function docsPage(config: ServerConfig): string {
  const base = baseUrl(config);
  const nav = `<a href="/">Dashboard</a><a href="/docs" class="active">API Docs</a><a href="/experts">Follow SEO Experts</a>`;

  const endpoints = [
    {
      method: "GET",
      path: "/api/health",
      desc: "Health check. Returns server status.",
      example: `curl ${base}/api/health`,
      response: `{
  "status": "ok",
  "timestamp": "2026-03-18T09:00:00.000Z"
}`,
    },
    {
      method: "GET",
      path: "/api/pages",
      desc: "List all generated pages with pagination.",
      params: [
        { name: "page", type: "number", def: "1", desc: "Page number" },
        { name: "limit", type: "number", def: "20", desc: "Items per page" },
      ],
      example: `curl "${base}/api/pages?page=1&limit=10"`,
      response: `{
  "data": [
    {
      "slug": "best-running-shoes",
      "keyword": "best running shoes",
      "title": "Best Running Shoes — Complete Guide",
      "meta_description": "Discover the top running shoes...",
      "body": "<h2>...</h2><p>...</p>",
      "internal_links": [],
      "published_date": "2026-03-18T00:00:00.000Z",
      "created_at": "2026-03-18T09:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}`,
    },
    {
      method: "GET",
      path: "/api/pages/:slug",
      desc: "Get a single page by its URL slug.",
      example: `curl ${base}/api/pages/best-running-shoes`,
      response: `{
  "slug": "best-running-shoes",
  "keyword": "best running shoes",
  "title": "Best Running Shoes — Complete Guide",
  "meta_description": "Discover the top running shoes...",
  "body": "<h2>Introduction</h2><p>...</p>",
  "internal_links": [
    { "anchor": "marathon training", "url": "/marathon-training" }
  ],
  "published_date": "2026-03-18T00:00:00.000Z",
  "created_at": "2026-03-18T09:00:00"
}`,
    },
    {
      method: "POST",
      path: "/api/generate",
      desc: "Generate new pages via the API. Triggers AI content generation.",
      body: `{
  "provider": "openai",       // optional — defaults to config
  "model": "gpt-5.2",         // optional — defaults to config
  "seed_data": [
    { "keyword": "best coffee makers" },
    { "keyword": "espresso guide", "category": "coffee" }
  ]
}`,
      example: `curl -X POST ${base}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{"seed_data":[{"keyword":"best coffee makers"}]}'`,
      response: `{
  "generated": 1,
  "failed": 0,
  "results": [
    { "slug": "best-coffee-makers", "keyword": "best coffee makers", "title": "...", "status": "success" }
  ],
  "errors": []
}`,
    },
    {
      method: "DELETE",
      path: "/api/pages/:slug",
      desc: "Delete a page by slug.",
      example: `curl -X DELETE ${base}/api/pages/best-running-shoes`,
      response: `{
  "success": true,
  "slug": "best-running-shoes"
}`,
    },
  ];

  const endpointHtml = endpoints
    .map((ep) => {
      const methodClass =
        ep.method === "GET"
          ? "get"
          : ep.method === "POST"
            ? "post"
            : ep.method === "DELETE"
              ? "delete"
              : "";
      const paramsHtml = ep.params
        ? `<div class="ep-params"><div class="params-title">Query Parameters</div><table><thead><tr><th>Param</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>${ep.params.map((p) => `<tr><td><code>${p.name}</code></td><td>${p.type}</td><td>${p.def}</td><td>${p.desc}</td></tr>`).join("")}</tbody></table></div>`
        : "";
      const bodyHtml = ep.body
        ? `<div class="ep-params"><div class="params-title">Request Body <span style="color:var(--text2);font-weight:400">(JSON)</span></div><pre><code>${escHtml(ep.body)}</code></pre></div>`
        : "";
      return `<div class="ep-card">
        <div class="ep-header">
          <span class="method-badge ${methodClass}">${ep.method}</span>
          <code class="ep-path">${ep.path}</code>
        </div>
        <p class="ep-desc">${ep.desc}</p>
        ${paramsHtml}
        ${bodyHtml}
        <div class="ep-params">
          <div class="params-title">Example</div>
          <pre><code>${escHtml(ep.example)}</code></pre>
        </div>
        <div class="ep-params">
          <div class="params-title">Response</div>
          <pre><code>${escHtml(ep.response)}</code></pre>
        </div>
      </div>`;
    })
    .join("");

  const body = `
<div class="container">
  <div style="margin-bottom:32px">
    <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">API Documentation</h1>
    <p style="color:var(--text2);font-size:15px">Base URL: <code style="background:var(--surface2);padding:3px 8px;border-radius:6px;font-family:var(--mono);font-size:13px">${base}/api</code></p>
  </div>

  <div class="section-title">Response Format</div>
  <div class="ep-card" style="margin-bottom:32px">
    <p class="ep-desc">All endpoints return JSON. Single page responses include: <code>slug</code>, <code>keyword</code>, <code>title</code>, <code>meta_description</code>, <code>body</code> (HTML), <code>internal_links</code>, <code>published_date</code>, and <code>created_at</code>. List endpoints wrap results in a paginated envelope with <code>data</code>, <code>total</code>, <code>page</code>, <code>limit</code>, and <code>totalPages</code>.</p>
  </div>

  <div class="section-title">Endpoints <span class="badge">${endpoints.length}</span></div>
  <div class="endpoints-list">${endpointHtml}</div>

  <div style="margin-top:48px;padding:24px;background:var(--surface);border:1px solid var(--border);border-radius:12px">
    <div class="section-title" style="margin-bottom:12px">Integration Example — WordPress</div>
    <pre style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;overflow-x:auto"><code style="font-size:13px;color:var(--text2)">${escHtml(`const res = await fetch("${base}/api/pages");
const { data } = await res.json();

for (const page of data) {
  await fetch("https://your-site.com/wp-json/wp/v2/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa("user:pass")
    },
    body: JSON.stringify({
      title: page.title,
      content: page.body,
      status: "publish"
    })
  });
}`)}</code></pre>
  </div>
</div>

<style>
  .endpoints-list{display:flex;flex-direction:column;gap:16px}
  .ep-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;overflow:hidden}
  .ep-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .method-badge{font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;font-family:var(--mono);letter-spacing:.5px}
  .method-badge.get{background:rgba(34,197,94,.15);color:var(--green)}
  .method-badge.post{background:rgba(6,182,212,.15);color:var(--accent)}
  .method-badge.delete{background:rgba(239,68,68,.15);color:var(--red)}
  .ep-path{font-size:15px;font-family:var(--mono);color:var(--text)}
  .ep-desc{font-size:14px;color:var(--text2);margin-bottom:16px}
  .ep-params{margin-bottom:16px}
  .ep-params:last-child{margin-bottom:0}
  .params-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-bottom:8px}
  .ep-params table{width:100%;border-collapse:collapse;font-size:13px}
  .ep-params th{text-align:left;padding:8px 12px;background:var(--bg);color:var(--text2);font-weight:500;border:1px solid var(--border)}
  .ep-params td{padding:8px 12px;border:1px solid var(--border)}
  .ep-params code{font-family:var(--mono);font-size:12px;background:var(--surface2);padding:2px 6px;border-radius:4px}
  .ep-params pre{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;overflow-x:auto;margin:0}
  .ep-params pre code{font-size:13px;color:var(--text2);background:none;padding:0}
</style>`;

  return layout("API Docs", nav, body, config);
}

export function expertsPage(config: ServerConfig): string {
  const nav = `<a href="/">Dashboard</a><a href="/docs">API Docs</a><a href="/experts" class="active">Follow SEO Experts</a>`;

  const experts = [
    { name: "Lily Ray", title: "VP of SEO Strategy & Research, Amsive", x: "lilyraynyc", linkedin: "lily-ray-44755615", focus: "Google algorithm updates, E-E-A-T, YMYL, AI content impact" },
    { name: "Barry Schwartz", title: "Editor, Search Engine Roundtable", x: "rustybrick", linkedin: "rustybrick", focus: "Search news, Google updates, algorithm changes" },
    { name: "Jes Scholz", title: "Growth Marketing Consultant & SEO Futurist", x: "jes_scholz", linkedin: "jes-scholz", focus: "Entity SEO, topical authority, AI search impact, technical SEO" },
    { name: "John Shehata", title: "CEO & Founder, NewzDash & GDdash", x: "JShehata", linkedin: "johnshehata", focus: "News SEO, Google Discover, audience development, editorial SEO" },
    { name: "Marie Haynes", title: "CEO, Marie Haynes Consulting", x: "marie_haynes", linkedin: "marie-haynes", focus: "Google penalties, E-E-A-T, algorithm recovery" },
    { name: "Aleyda Solis", title: "International SEO Consultant & Founder, Orainti", x: "aleyda", linkedin: "aleydasolis", focus: "International SEO, technical SEO, SEO strategy" },
    { name: "Kevin Indig", title: "Growth Advisor", x: "Kevin_Indig", linkedin: "kevinindig", focus: "SEO strategy, growth, programmatic SEO, AI search" },
    { name: "Cyrus Shepard", title: "Founder, Zyppy", x: "CyrusShepard", linkedin: "cyrusshepard", focus: "On-page SEO, CTR optimization, Google ranking factors" },
    { name: "Glenn Gabe", title: "SEO Consultant, G-Squared Interactive", x: "glenngabe", linkedin: "glenngabe", focus: "Algorithm updates, site audits, Google penalties" },
    { name: "Mordy Oberstein", title: "Head of Brand, SE Ranking", x: "MordyOberstein", linkedin: "mordyoberstein", focus: "Search trends, SERP analysis, SEO branding" },
    { name: "Brodie Clark", title: "SEO Consultant", x: "brodieseo", linkedin: "brodieclark", focus: "Google SERP changes, Search features, algorithm tracking" },
    { name: "Patrick Stox", title: "Product Advisor, Technical SEO & Brand Ambassador, Ahrefs", x: "patrickstox", linkedin: "patrickstox", focus: "Technical SEO, site architecture, crawling" },
    { name: "Gagan Ghotra", title: "SEO Consultant, Gagan Ghotra Consulting", x: "gaganghotra_", linkedin: "gagan-ghotra", focus: "Google Discover, technical SEO, algorithm updates, AI Overviews" },
    { name: "Harpreet Singh Chatha", title: "SEO & AI Search Consultant, HarpsDigital", x: "harpreetchatha_", linkedin: "harpreet-singh-11889228a", focus: "Ecommerce SEO, international SEO, AI search optimization" },
    { name: "Metehan Yesilyurt", title: "Founder, metehan.ai", x: "metehan777", linkedin: "metehanyesilyurt", focus: "AI search optimization, programmatic SEO, LLM visibility" },
  ];

  const expertsHtml = experts.map(e => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:16px;font-weight:600;color:var(--text)">${escHtml(e.name)}</div>
          <div style="font-size:13px;color:var(--text2)">${escHtml(e.title)}</div>
        </div>
        <div style="display:flex;gap:8px">
          <a href="https://x.com/${e.x}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:4px;font-size:12px;padding:5px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);font-weight:500;transition:all .15s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--text)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">𝕏 @${e.x}</a>
          <a href="https://linkedin.com/in/${e.linkedin}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:4px;font-size:12px;padding:5px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);font-weight:500;transition:all .15s" onmouseover="this.style.borderColor='#0a66c2';this.style.color='#0a66c2'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">in LinkedIn</a>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text2);line-height:1.5">${escHtml(e.focus)}</div>
    </div>
  `).join("");

  const body = `
<div class="container">
  <div style="margin-bottom:32px">
    <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">Follow SEO Experts</h1>
    <p style="color:var(--text2);font-size:15px;max-width:700px;line-height:1.7">
      Programmatic SEO is powerful, but it comes with risks. Google's algorithms are constantly evolving, and what works today might trigger penalties tomorrow. Stay informed by following these industry experts who track algorithm updates, share best practices, and help you avoid costly mistakes.
    </p>
  </div>

  <div style="background:linear-gradient(135deg,rgba(234,179,8,.08),rgba(249,115,22,.08));border:1px solid rgba(234,179,8,.25);border-radius:12px;padding:20px 24px;margin-bottom:32px">
    <div style="font-size:14px;color:var(--text);line-height:1.7">
      <strong style="color:var(--yellow)">Why this matters:</strong>
      Publishing large volumes of AI-generated content all at once might seem like a fast path to scaling your SEO, AEO, or GEO strategy. But search engines are watching. After an initial boost, you risk being penalized by Google or getting caught in an algorithm update. Rankings can drop overnight, and recovery takes months. The difference between success and penalty often comes down to content quality, publishing velocity, and staying ahead of algorithm changes. These experts will help you do that.
    </div>
  </div>

  <div class="section-title">Experts to Follow <span class="badge">${experts.length}</span></div>
  <div style="display:flex;flex-direction:column;gap:12px">
    ${expertsHtml}
  </div>

  <div style="margin-top:48px;padding:24px;background:var(--surface);border:1px solid var(--border);border-radius:12px">
    <div class="section-title" style="margin-bottom:12px">Best Practices for Programmatic SEO</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
      <div style="padding:16px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--green)">Publish Gradually</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">Drip-feed pages over days or weeks. Publishing 1000 pages overnight is a red flag for quality algorithms.</div>
      </div>
      <div style="padding:16px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--green)">Review Before Publishing</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">Read every page. Fix errors, add nuance, remove anything that sounds generic. Human review is non-negotiable.</div>
      </div>
      <div style="padding:16px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--green)">Add Unique Value</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">Original images, proprietary data, first-hand experience, expert quotes. Content that only you can provide.</div>
      </div>
      <div style="padding:16px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--green)">Monitor & Adapt</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">Watch Google Search Console for manual actions and ranking shifts. Follow the experts above to catch algorithm updates early.</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:32px;padding:16px;color:var(--text2);font-size:13px">
    ContentClaw by <a href="https://metehan.ai">metehan.ai</a> · <a href="https://www.npmjs.com/package/contentclaw">npm</a> · <a href="https://github.com/metehan777/contentclaw">GitHub</a>
  </div>
</div>`;

  return layout("Follow SEO Experts", nav, body, config);
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
