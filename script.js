let data = null;
const FEATURED_ID = 'koi-ijou-no-koto-wo-kanojo-janai-kimi-to';

async function init() {
  try {
    const res = await fetch('data.json');
    data = await res.json();
    renderHome();
    renderSeries();
    renderLatest();
    renderFooter();
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('series/')) {
      navigateTo('detail', hash.split('/')[1]);
    } else if (['home', 'series', 'latest'].includes(hash)) {
      navigateTo(hash);
    }
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function navigateTo(page, param) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));

  if (page === 'detail' && param) {
    renderDetail(param);
    document.getElementById('page-detail').classList.add('active');
    window.location.hash = 'series/' + param;
    const sp = document.querySelector('[data-page="series"]');
    if (sp) sp.classList.add('active');
  } else {
    document.getElementById('page-' + page).classList.add('active');
    const pill = document.querySelector(`[data-page="${page}"]`);
    if (pill) pill.classList.add('active');
    window.location.hash = page === 'home' ? '' : page;
  }
  window.scrollTo(0, 0);
}

function coverFallback(s) {
  const colors = [['#c9a0dc','#e0c6f0'],['#f0b0c0','#f8d0d8'],['#a0b8dc','#c0d4f0'],['#dcb0a0','#f0d0c0'],['#a0dcb0','#c0f0d0'],['#dcd0a0','#f0e8c0'],['#b0a0dc','#d0c0f0'],['#e8a0b8','#f5c0d0'],['#f5d0a0','#fae8c0'],['#a0c8dc','#c0e0f0']];
  const idx = s.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % colors.length;
  const [c1,c2] = colors[idx];
  return `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center"><span class="cover-fallback">${s.title.charAt(0)}</span></div>`;
}

function renderCover(s) {
  if (!s.cover) return coverFallback(s);
  return `<img src="${s.cover}" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend', coverFallback(data.series.find(x=>x.id==='${s.id}')))">`;
}

function volCount(s) { return s.volumes ? s.volumes.length : 1; }
function volLabel(s) { const n = volCount(s); return n > 1 ? n + ' VOLUMES' : 'COMPLETE'; }

function allVols() {
  const out = [];
  data.series.forEach(s => {
    if (s.volumes) { s.volumes.forEach(v => out.push({...v, seriesId: s.id, seriesTitle: s.title, cover: s.cover})); }
    else { out.push({vol:1, title:s.title, epub:s.epub, download:s.download, seriesId:s.id, seriesTitle:s.title, cover:s.cover}); }
  });
  return out;
}

/* === HOME === */
function renderHome() {
  const featured = data.series.find(s => s.id === FEATURED_ID) || data.series[0];
  const totalVolumes = allVols().length;

  document.getElementById('page-home').innerHTML = `
    <section class="featured">
      <div class="featured-inner">
        <div class="featured-cover">
          <div style="width:260px;height:360px;border-radius:4px 12px 12px 4px;box-shadow:var(--shadow-lg);overflow:hidden;position:relative;cursor:pointer" onclick="navigateTo('detail','${featured.id}')">${renderCover(featured)}</div>
          <p class="pull-text">CLICK TO VIEW SERIES</p>
        </div>
        <div class="featured-info">
          <span class="badge-new">FEATURED SERIES</span>
          <h1 class="featured-title">${featured.title}</h1>
          <p class="featured-desc">${featured.description || 'By ' + featured.author + '. ' + volLabel(featured) + ' available for download.'}</p>
          <div class="featured-actions">
            <a href="javascript:void(0)" class="btn btn-download" onclick="navigateTo('detail','${featured.id}')">View &amp; Download</a>
            <a href="javascript:void(0)" class="btn btn-outline" onclick="navigateTo('series')">Browse All Series</a>
          </div>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="stats-inner">
        <div class="stat-card"><span class="stat-label">SERIES</span><span class="stat-value">${data.series.length}</span></div>
        <div class="stat-card"><span class="stat-label">TOTAL VOLUMES</span><span class="stat-value">${totalVolumes}</span></div>
        <div class="stat-card"><span class="stat-label">STATUS</span><span class="stat-value">Completed</span></div>
      </div>
    </section>

    <section class="latest-section">
      <h2 class="section-title">All Series</h2>
      <div class="chapters-carousel">
        ${data.series.slice(0, 12).map(s => `
          <div class="chapter-card" onclick="navigateTo('detail','${s.id}')">
            <div class="chapter-cover">${renderCover(s)}</div>
            <div class="chapter-info">
              <span class="ch-vol">${volLabel(s)}</span>
              <span class="ch-title">${s.title}</span>
              <span class="ch-date">${s.author}</span>
            </div>
          </div>`).join('')}
      </div>
    </section>

    ${communityBlock()}
  `;
}

function communityBlock() {
  return `
    <section class="community" style="padding-top:48px">
      <div class="community-inner">
        <div class="community-text">
          <span class="section-badge community-badge">COMMUNITY</span>
          <h2>Join the Discord for updates.</h2>
          <p>Get translation updates and future release pings from the community server.</p>
          <a href="#" class="btn btn-discord">Join Discord</a>
        </div>
        <div class="community-art"><span class="community-big-text">JOIN OUR<br>DISCORD</span></div>
      </div>
    </section>`;
}

/* === SERIES SHELF === */
function matchesQuery(s, q) {
  return s.title.toLowerCase().includes(q)
    || s.author.toLowerCase().includes(q)
    || (s.altJp && s.altJp.toLowerCase().includes(q))
    || (s.altEn && s.altEn.toLowerCase().includes(q))
    || (s.tags && s.tags.some(t => t.toLowerCase().includes(q)));
}

function seriesCard(s) {
  return `<div class="series-card" onclick="navigateTo('detail','${s.id}')">
      <div class="series-cover">${renderCover(s)}</div>
      <span class="series-volumes">${volLabel(s)}${s.translation === 'mtl' ? ' <span class="mtl-badge">MTL</span>' : ''}</span>
      <span class="series-name">${s.title}</span>
      ${s.tags && s.tags.length ? `<div class="card-tags">${s.tags.slice(0,3).map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>` : ''}
    </div>`;
}

function filterSeries() {
  const input = document.getElementById('seriesSearch');
  if (!input) return;
  const q = input.value.toLowerCase().trim();
  const all = data.series;
  const filtered = q ? all.filter(s => matchesQuery(s, q)) : all;
  const completed = filtered.filter(s => s.status === 'completed');

  const countEl = document.getElementById('filterCount');
  const gridC = document.getElementById('completedGrid');
  const emptyE = document.getElementById('seriesEmpty');

  if (countEl) countEl.textContent = 'Showing ' + filtered.length + ' of ' + all.length + ' series';
  if (gridC) gridC.innerHTML = completed.map(seriesCard).join('');
  if (emptyE) emptyE.style.display = filtered.length ? 'none' : 'block';
}

function renderSeries() {
  const all = data.series;

  document.getElementById('page-series').innerHTML = `
    <section class="shelf-header">
      <div class="shelf-header-inner">
        <div>
          <span class="section-badge library-badge">LIBRARY</span>
          <h1 class="shelf-title">Series shelf</h1>
          <p class="shelf-subtitle">All completed translations. Click a title to view and download.</p>
        </div>
        <div class="filter-box">
          <span class="filter-label">FILTER SERIES</span>
          <div class="filter-input-wrap">
            <input type="text" id="seriesSearch" class="filter-input" placeholder="Search title, tag, or author..." oninput="filterSeries()">
            <button class="filter-btn" onclick="document.getElementById('seriesSearch').value='';filterSeries()">&#8634;</button>
          </div>
          <span class="filter-count" id="filterCount">Showing ${all.length} of ${all.length} series</span>
        </div>
      </div>
    </section>
    <section class="series-group"><div class="series-group-header"><h2>COMPLETED</h2><span class="series-count">${all.length}</span></div><div class="series-grid" id="completedGrid">${all.filter(s=>s.status==='completed').map(seriesCard).join('')}</div></section>
    <div id="seriesEmpty" class="empty-state" style="display:none">No series match your filter.</div>
    ${communityBlock()}
  `;
}

/* === LATEST === */
function renderLatest() {
  const all = allVols().filter(v => v.download || v.epub);
  document.getElementById('page-latest').innerHTML = `
    <section class="latest-page">
      <h1 class="page-title">Download List</h1>
      <p class="page-subtitle">All available volumes with EPUB download links.</p>
      <div class="latest-list">
        ${all.map(v => `
          <div class="latest-item" onclick="navigateTo('detail','${v.seriesId}')">
            <div class="latest-item-cover">${renderCover(data.series.find(s=>s.id===v.seriesId))}</div>
            <div class="latest-item-info">
              <span class="latest-series-name">${v.seriesTitle}</span>
              <span class="latest-chapter-name">${v.title}</span>
            </div>
            ${v.download ? `<a href="${encodeURI(v.download)}" class="btn-dl" onclick="event.stopPropagation()">Download</a>` : ''}
          </div>`).join('')}
      </div>
    </section>`;
}

/* === DETAIL === */
function renderDetail(seriesId) {
  const s = data.series.find(x => x.id === seriesId);
  if (!s) return;
  const vols = s.volumes || [{ vol: 1, title: s.title, epub: s.epub, cover: s.cover, download: s.download }];
  const multi = vols.length > 1;
  const alts = [];
  if (s.altJp) alts.push(s.altJp);
  if (s.altEn) alts.push(s.altEn);

  document.getElementById('page-detail').innerHTML = `
    <div class="breadcrumb-bar">
      <div class="breadcrumb-inner">
        <a href="javascript:void(0)" onclick="navigateTo('home')">HOME</a><span>/</span>
        <a href="javascript:void(0)" onclick="navigateTo('series')">SERIES</a><span>/</span>
        <span class="breadcrumb-current">${s.title.toUpperCase()}</span>
      </div>
    </div>
    ${s.translation === 'mtl' ? `
    <div class="mtl-warning">
      <div class="mtl-warning-inner">
        <span class="mtl-icon">⚠️</span>
        <div>
          <strong>Peringatan MTL (Machine Translation)</strong>
          <span>Terjemahan ini dikerjakan menggunakan bantuan mesin (AI). Hasil mungkin tidak sempurna. Jika ada kesalahan, silakan kontribusi melalui Discord!</span>
        </div>
      </div>
    </div>` : ''}
    <section class="detail-hero">
      <div class="detail-hero-inner">
        <div class="detail-cover-wrap"><div class="detail-cover">${renderCover(s)}</div></div>
        <div class="detail-info">
          <h1 class="detail-title">${s.title}</h1>
          ${alts.length ? `<div class="tag-list">${alts.map(a => `<span class="tag">${a}</span>`).join('')}</div>` : ''}
          ${s.tags && s.tags.length ? `<div class="tag-list">${s.tags.map(t=>`<span class="tag genre-tag">${t}</span>`).join('')}</div>` : ''}
          <p class="detail-desc">${s.description || 'By ' + s.author + '.'}</p>
          <span class="status-badge ${s.status}"><span class="status-dot"></span> ${s.status.toUpperCase()}</span>
          <div class="detail-actions">
            ${vols[0].download ? `<a href="${encodeURI(vols[0].download)}" class="btn btn-start">Download</a>` : ''}
          </div>
        </div>
      </div>
    </section>
    <section class="detail-content">
      <div class="detail-content-inner">
        <aside class="detail-sidebar">
          <div class="sidebar-card">
            <div class="sidebar-meta">
              <div class="meta-item"><span class="meta-label">AUTHOR</span><span class="meta-value">${s.author}</span></div>
              ${multi ? `<div class="meta-item"><span class="meta-label">VOLUMES</span><span class="meta-value">${vols.length}</span></div>` : ''}
              <div class="meta-item"><span class="meta-label">STATUS</span><span class="meta-value">${s.status}</span></div>
              <div class="meta-item"><span class="meta-label">TRANSLATION</span><span class="meta-value">${s.translation === 'mtl' ? 'MTL' : 'HTL'}</span></div>
              ${s.altJp ? `<div class="meta-item"><span class="meta-label">JAPANESE</span><span class="meta-value">${s.altJp}</span></div>` : ''}
            </div>
          </div>
        </aside>
        <main class="detail-main">
          ${vols.map((v, idx) => `
          <div class="volume-section">
            <div class="volume-layout">
              <div class="volume-text">
                <div class="volume-header">
                  <h2 class="volume-title">${multi ? 'Volume ' + v.vol : 'Download'}</h2>
                  ${v.download ? `<a href="${encodeURI(v.download)}" class="btn btn-start btn-dl-vol">Download EPUB</a>` : ''}
                </div>
              </div>
              ${v.cover ? `<div class="volume-cover"><img src="${v.cover}" onerror="this.parentElement.style.display='none'" alt="${v.title}"></div>` : ''}
            </div>
            <div class="chapter-list">
              ${v.download ? `
              <div class="chapter-item">
                <div class="chapter-item-left">
                  <span class="chapter-vol-tag">${v.title || s.title}</span>
                  <span class="chapter-item-date">${s.author}</span>
                </div>
                <a href="${encodeURI(v.download)}" class="btn-dl">Download</a>
              </div>` : ''}
            </div>
          </div>`).join('')}
        </main>
      </div>
    </section>`;
}

/* === FOOTER === */
function renderFooter() {
  const sample = data.series.slice(0, 8);
  document.getElementById('footerLinks').innerHTML = `
    <a href="javascript:void(0)" onclick="navigateTo('home')">Home</a>
    <a href="javascript:void(0)" onclick="navigateTo('series')">Series</a>
    <a href="javascript:void(0)" onclick="navigateTo('latest')">Download List</a>
    ${sample.map(s => `<a href="javascript:void(0)" onclick="navigateTo('detail','${s.id}')">${s.title}</a>`).join('')}
    <a href="#">Privacy</a><a href="#">DMCA</a>`;
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#','');
  if (hash.startsWith('series/')) navigateTo('detail', hash.split('/')[1]);
  else if (['home','series','latest'].includes(hash)) navigateTo(hash);
});

init();
