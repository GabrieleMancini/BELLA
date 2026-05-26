/**
 * BELLA — Event Archive Page Engine
 * Fetches all media from GitHub and renders the page automatically.
 * Reads the BELLA config object defined in each event's index.html.
 */

const IMG_EXT   = ['jpg','jpeg','png','webp','gif','heic','avif'];
const VIDEO_EXT = ['mp4','mov','webm','m4v'];

function ext(name) { return name.split('.').pop().toLowerCase(); }
function isImage(name) { return IMG_EXT.includes(ext(name)); }
function isVideo(name) { return VIDEO_EXT.includes(ext(name)); }

// ── Build the page skeleton ──────────────────────────────────────────────────
function buildShell() {
  document.documentElement.lang = 'en';
  document.head.insertAdjacentHTML('beforeend',
    `<meta name="theme-color" content="#017789">`);

  document.body.innerHTML = `
    <nav>
      <div class="top-bar">
        <a href="../../index.html" class="back-link">All happenings</a>
        <a href="../../index.html" class="top-brand">BELLA</a>
      </div>
    </nav>

    <main class="page-card">
      <div class="event-header">
        <span class="event-label">Archive · ${BELLA.date}</span>
        <h1 class="event-title">${BELLA.name}</h1>
        <div class="event-meta" id="event-meta">
          <span class="event-meta-item"><span class="pip"></span>${BELLA.venue}</span>
          <span class="event-meta-item"><span class="pip"></span>${BELLA.artists}</span>
          <span class="event-meta-item" id="meta-count"><span class="pip"></span>Loading…</span>
        </div>
      </div>

      <hr class="section-divider">

      <span class="media-section-label" id="photos-label">
        Photos <span class="count" id="photo-count">…</span>
      </span>
      <div class="media-grid" id="photo-grid">
        <div class="state-box">
          <div class="spinner"></div>
          <p>Loading photos</p>
        </div>
      </div>

      <div id="video-section" style="display:none;">
        <hr class="section-divider">
        <span class="media-section-label" id="videos-label">
          Videos <span class="count" id="video-count">…</span>
        </span>
        <div class="media-grid" id="video-grid"></div>
      </div>
    </main>

    <footer class="page-footer">
      <a href="mailto:ciao@bella-afternoon.com">ciao@bella-afternoon.com</a>
      <span class="ft-copy">© 2026 BELLA — Mediterranean Happenings</span>
    </footer>

    <div id="lightbox" role="dialog" aria-modal="true">
      <button id="lb-close" aria-label="Close">✕</button>
      <img id="lb-img" src="" alt="">
      <div id="lb-nav">
        <button id="lb-prev">← Prev</button>
        <span id="lb-counter"></span>
        <button id="lb-next">Next →</button>
      </div>
    </div>
  `;
}

// ── Fetch file list from GitHub Contents API ─────────────────────────────────
async function fetchMediaList() {
  const url = `https://api.github.com/repos/${BELLA.githubUser}/${BELLA.githubRepo}/contents/${BELLA.folder}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `GitHub API ${res.status}`);
  }

  const files = await res.json();
  // Sort by filename for consistent ordering
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const images = files.filter(f => f.type === 'file' && isImage(f.name));
  const videos = files.filter(f => f.type === 'file' && isVideo(f.name));
  return { images, videos };
}

// ── Render photos ────────────────────────────────────────────────────────────
function renderPhotos(images) {
  const grid = document.getElementById('photo-grid');
  document.getElementById('photo-count').textContent = images.length;

  if (images.length === 0) {
    grid.innerHTML = `<div class="state-box"><p>No photos yet</p></div>`;
    return;
  }

  grid.innerHTML = '';
  images.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'mi photo';
    div.style.cssText = 'opacity:0; transform:translateY(16px); transition:opacity .5s ease, transform .5s ease;';
    div.innerHTML = `<img src="${img.download_url}" alt="${img.name}" loading="lazy">`;
    div.addEventListener('click', () => openLightbox(i));
    grid.appendChild(div);
  });

  // Staggered fade-in
  fadeIn(grid.querySelectorAll('.mi'));
}

// ── Render videos ─────────────────────────────────────────────────────────────
function renderVideos(videos) {
  if (videos.length === 0) return;

  document.getElementById('video-section').style.display = '';
  document.getElementById('video-count').textContent = videos.length;
  const grid = document.getElementById('video-grid');
  grid.innerHTML = '';

  videos.forEach(vid => {
    const div = document.createElement('div');
    div.className = 'mi video';
    div.style.cssText = 'opacity:0; transform:translateY(16px); transition:opacity .5s ease, transform .5s ease;';
    div.innerHTML = `
      <span class="video-pill">Video</span>
      <video controls playsinline preload="metadata">
        <source src="${vid.download_url}" type="video/${ext(vid.name) === 'mov' ? 'mp4' : ext(vid.name)}">
      </video>
    `;
    grid.appendChild(div);
  });

  fadeIn(grid.querySelectorAll('.mi'));
}

// ── Update meta count badge ──────────────────────────────────────────────────
function updateMetaCount(images, videos) {
  const parts = [];
  if (images.length) parts.push(`${images.length} photo${images.length !== 1 ? 's' : ''}`);
  if (videos.length) parts.push(`${videos.length} video${videos.length !== 1 ? 's' : ''}`);
  document.getElementById('meta-count').innerHTML =
    `<span class="pip"></span>${parts.join(' · ') || 'No media yet'}`;
}

// ── Fade-in helper (IntersectionObserver) ────────────────────────────────────
function fadeIn(els) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  els.forEach(el => obs.observe(el));
}

// ── Error state ──────────────────────────────────────────────────────────────
function showError(message) {
  const isConfigError = BELLA.githubUser === 'YOUR_GITHUB_USERNAME';
  document.getElementById('photo-grid').innerHTML = `
    <div class="state-box">
      <p style="opacity:1; font-size:.8rem; margin-bottom:12px;">
        ${isConfigError
          ? '⚙️ Open this file and set <strong>githubUser</strong> and <strong>githubRepo</strong> in the BELLA config block at the top.'
          : `⚠️ Could not load media: ${message}`
        }
      </p>
      ${!isConfigError ? `<p><a href="https://api.github.com/repos/${BELLA.githubUser}/${BELLA.githubRepo}/contents/${BELLA.folder}" target="_blank">Check API response →</a></p>` : ''}
    </div>`;
  document.getElementById('meta-count').innerHTML = `<span class="pip"></span>—`;
  document.getElementById('photo-count').textContent = '0';
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
let lbPhotos = [];
let lbIdx    = 0;

function openLightbox(i) {
  lbIdx = i;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lbStep(dir) {
  lbIdx = (lbIdx + dir + lbPhotos.length) % lbPhotos.length;
  updateLightbox();
}

function updateLightbox() {
  document.getElementById('lb-img').src  = lbPhotos[lbIdx].src;
  document.getElementById('lb-img').alt  = lbPhotos[lbIdx].alt;
  document.getElementById('lb-counter').textContent = `${lbIdx + 1} / ${lbPhotos.length}`;
}

// ── Wire up lightbox controls ─────────────────────────────────────────────────
function initLightbox() {
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => lbStep(-1));
  document.getElementById('lb-next').addEventListener('click', () => lbStep(1));
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  lbStep(1);
    if (e.key === 'ArrowLeft')   lbStep(-1);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
buildShell();
initLightbox();

fetchMediaList()
  .then(({ images, videos }) => {
    // Store photo srcs for lightbox
    lbPhotos = images.map(f => ({ src: f.download_url, alt: f.name }));

    renderPhotos(images);
    renderVideos(videos);
    updateMetaCount(images, videos);
  })
  .catch(err => {
    console.error('[BELLA]', err);
    showError(err.message);
  });
