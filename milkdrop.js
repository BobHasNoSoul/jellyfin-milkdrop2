//injection created by BobHasNoSoul github.com/bobhasnosoul
//a massive thanks to jberg visit the original butterchurn repo here github.com/jberg/butterchurn 
(function () {
  'use strict';
  if (window.__milkdropJellyfinLoaded) return;
  window.__milkdropJellyfinLoaded = true;
  // butterchurn urls adjust as needed if you wanted to put the files on your own server for privacy or backup reasons
  const BUTTERCHURN_URL     = 'https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js';
  const BUTTERCHURN_PRESETS = 'https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js';
  let audioCtx       = null;
  let analyser       = null;
  let gainNode       = null;
  let mediaSource    = null;
  let tappedElement  = null;
  let visualizer     = null;
  let presetKeys     = [];
  let currentPreset  = 0;
  let animFrame      = null;
  let autoCycle      = false;
  let autoCycleTimer = null;
  let sensitivity    = 1.0;
  let overlayOpen    = false;
  let butterchurnReady = false;

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');

    #md-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid rgba(0,255,231,0.35);
      border-radius: 3px;
      color: rgba(0,255,231,0.8);
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      padding: 4px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      vertical-align: middle;
      margin: 0 6px;
      flex-shrink: 0;
    }
    #md-trigger-btn:hover {
      background: rgba(0,255,231,0.1);
      border-color: rgba(0,255,231,0.8);
      color: #00ffe7;
      box-shadow: 0 0 12px rgba(0,255,231,0.3);
    }
    #md-trigger-btn.md-active {
      background: rgba(0,255,231,0.15);
      border-color: #00ffe7;
      color: #fff;
      box-shadow: 0 0 16px rgba(0,255,231,0.4);
    }
    #md-trigger-btn svg {
      width: 14px; height: 14px;
      flex-shrink: 0;
    }

    #md-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
    }
    #md-overlay.md-open {
      opacity: 1;
      pointer-events: all;
    }

    #md-overlay::after {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px
      );
      pointer-events: none;
      z-index: 2;
    }

    #md-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    #md-hud {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px 18px;
      background: linear-gradient(transparent, rgba(0,0,0,0.75));
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      font-family: 'Share Tech Mono', monospace;
    }
    #md-hud.md-hud-visible {
      opacity: 1;
      pointer-events: all;
    }

    .md-btn {
      background: rgba(0,15,20,0.85);
      border: 1px solid rgba(0,255,231,0.2);
      border-radius: 3px;
      color: #00ffe7;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      padding: 5px 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .md-btn:hover {
      background: rgba(0,255,231,0.1);
      border-color: #00ffe7;
      box-shadow: 0 0 12px rgba(0,255,231,0.25);
    }
    .md-btn.md-on {
      background: rgba(0,255,231,0.18);
      color: #fff;
      border-color: #00ffe7;
    }

    #md-track {
      flex: 1;
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      letter-spacing: 0.07em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    #md-track span {
      color: rgba(255,255,255,0.35);
      font-size: 11px;
      margin-left: 8px;
    }

    #md-preset-label {
      font-size: 10px;
      color: rgba(0,255,231,0.45);
      letter-spacing: 0.1em;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
    }

    #md-sens-label {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.1em;
      flex-shrink: 0;
      min-width: 70px;
      text-align: center;
    }

    #md-logo {
      position: absolute;
      top: 16px; left: 20px;
      font-family: 'Orbitron', monospace;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.25em;
      color: rgba(0,255,231,0.3);
      z-index: 5;
      pointer-events: none;
      text-transform: uppercase;
    }

    #md-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 6;
      background: #000;
      font-family: 'Orbitron', monospace;
      color: #00ffe7;
      font-size: 14px;
      letter-spacing: 0.3em;
      text-shadow: 0 0 20px #00ffe7;
      gap: 20px;
    }
    #md-loading.md-hidden { display: none; }
    #md-spinner {
      width: 40px; height: 40px;
      border: 2px solid rgba(0,255,231,0.15);
      border-top-color: #00ffe7;
      border-radius: 50%;
      animation: md-spin 0.8s linear infinite;
    }
    @keyframes md-spin { to { transform: rotate(360deg); } }

    #md-error {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 7;
      background: rgba(0,0,0,0.9);
      font-family: 'Share Tech Mono', monospace;
      color: #ff4466;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-align: center;
      padding: 2rem;
      gap: 12px;
    }
    #md-error.md-visible { display: flex; }
    #md-error button {
      margin-top: 8px;
      padding: 6px 16px;
      border: 1px solid #ff4466;
      background: transparent;
      color: #ff4466;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'md-overlay';
  overlay.innerHTML = `
    <canvas id="md-canvas"></canvas>
    <div id="md-logo">MILKDROP</div>
    <div id="md-loading">
      <div id="md-spinner"></div>
      <div>LOADING VISUALISER</div>
    </div>
    <div id="md-error">
      <div id="md-error-msg">Could not tap audio.</div>
      <button id="md-error-close">CLOSE</button>
    </div>
    <div id="md-hud">
      <button class="md-btn" id="md-btn-preset">âŸ³ PRESET</button>
      <button class="md-btn" id="md-btn-auto">AUTO</button>
      <div id="md-track">â€”</div>
      <div id="md-preset-label">â€”</div>
      <div id="md-sens-label">SENS 1.0Ã—</div>
      <button class="md-btn" id="md-btn-sens-down">âˆ’ SENS</button>
      <button class="md-btn" id="md-btn-sens-up">+ SENS</button>
      <button class="md-btn" id="md-btn-close">âœ• CLOSE</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const canvas       = document.getElementById('md-canvas');
  const hud          = document.getElementById('md-hud');
  const loadingEl    = document.getElementById('md-loading');
  const errorEl      = document.getElementById('md-error');
  const errorMsg     = document.getElementById('md-error-msg');
  const trackLabel   = document.getElementById('md-track');
  const presetLabel  = document.getElementById('md-preset-label');
  const sensLabel    = document.getElementById('md-sens-label');
  const btnPreset    = document.getElementById('md-btn-preset');
  const btnAuto      = document.getElementById('md-btn-auto');
  const btnSensUp    = document.getElementById('md-btn-sens-up');
  const btnSensDown  = document.getElementById('md-btn-sens-down');
  const btnClose     = document.getElementById('md-btn-close');
  const btnErrClose  = document.getElementById('md-error-close');

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load: ' + url));
      document.head.appendChild(s);
    });
  }

  async function ensureButterchurn() {
    if (butterchurnReady) return true;
    try {
      await loadScript(BUTTERCHURN_URL);
      await loadScript(BUTTERCHURN_PRESETS);
      butterchurnReady = true;
      return true;
    } catch (e) {
      console.error('[MilkDrop]', e);
      return false;
    }
  }

  function findMediaElement() {
    const selectors = [
      '.htmlvideoplayer',
      '.videoPlayerContainer video',
      '#videoPlayer video',
      'video.htmlvideoplayer',
      'audio',
      'video',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && (el.src || el.currentSrc) && !el.paused || el && el.readyState > 1) {
        return el;
      }
    }
    for (const sel of ['video', 'audio']) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if (el.src || el.currentSrc || el.readyState > 1) return el;
      }
    }
    return null;
  }

  function getTrackName() {
    const selectors = [
      '.nowPlayingBarText .nowPlayingBarInfoText',
      '[data-testid="now-playing-text"]',
      '.nowPlayingBarInfoText',
      '.nowPlayingBarText',
      '.mediaInfoText',
      '.itemName',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return 'Now Playing';
  }

  function setupAudio(mediaEl) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (mediaSource && tappedElement === mediaEl) {
      return true;
    }

    if (mediaSource && tappedElement !== mediaEl) {
      try { mediaSource.disconnect(); } catch (e) {}
      mediaSource = null;
    }

    try {
      gainNode = audioCtx.createGain();
      gainNode.gain.value = sensitivity;

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      mediaSource = audioCtx.createMediaElementSource(mediaEl);
      tappedElement = mediaEl;

      mediaSource.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      return true;
    } catch (e) {
      console.error('[MilkDrop] Could not create MediaElementSource:', e);
      return false;
    }
  }

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (visualizer) visualizer.setRendererSize(canvas.width, canvas.height);
  }

  function initVisualizer() {
    if (visualizer) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    visualizer = butterchurn.default.createVisualizer(audioCtx, canvas, {
      width: canvas.width,
      height: canvas.height,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1,
    });

    const presets = butterchurnPresets.getPresets();
    presetKeys = Object.keys(presets);
    currentPreset = Math.floor(Math.random() * presetKeys.length);
    loadPreset(currentPreset);
    visualizer.connectAudio(analyser);
  }

  function loadPreset(index) {
    const presets = butterchurnPresets.getPresets();
    const key = presetKeys[index];
    visualizer.loadPreset(presets[key], 2.0);
    presetLabel.textContent = key;
  }

  function randomPreset() {
    currentPreset = Math.floor(Math.random() * presetKeys.length);
    loadPreset(currentPreset);
  }

  function startRender() {
    if (animFrame) return;
    (function loop() {
      animFrame = requestAnimationFrame(loop);
      if (visualizer && overlayOpen) visualizer.render();
    })();
  }

  function stopRender() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  }

  function startAutoCycle() {
    stopAutoCycle();
    autoCycleTimer = setInterval(randomPreset, 15000);
    btnAuto.classList.add('md-on');
    autoCycle = true;
  }

  function stopAutoCycle() {
    if (autoCycleTimer) { clearInterval(autoCycleTimer); autoCycleTimer = null; }
    btnAuto.classList.remove('md-on');
    autoCycle = false;
  }

  async function openVisualiser() {
    overlay.classList.add('md-open');
    overlayOpen = true;
    loadingEl.classList.remove('md-hidden');
    errorEl.classList.remove('md-visible');

    triggerBtn && triggerBtn.classList.add('md-active');

    const ok = await ensureButterchurn();
    if (!ok) {
      showError('Could not load Butterchurn library.\nCheck your internet connection.');
      return;
    }

    const mediaEl = findMediaElement();
    if (!mediaEl) {
      showError('No active media found.\nStart playing something in Jellyfin first, then open the visualiser.');
      return;
    }

    const audioOk = setupAudio(mediaEl);
    if (!audioOk) {
      showError('Could not tap the audio stream.\nThis can happen if another extension already intercepted it.');
      return;
    }

    initVisualizer();
    loadingEl.classList.add('md-hidden');

    trackLabel.innerHTML = getTrackName();

    startRender();

    watchTrackChanges();
  }

  function closeVisualiser() {
    overlay.classList.remove('md-open');
    overlayOpen = false;
    stopRender();
    stopAutoCycle();
    triggerBtn && triggerBtn.classList.remove('md-active');
    stopWatchingTrack();
  }

  function showError(msg) {
    loadingEl.classList.add('md-hidden');
    errorMsg.textContent = msg;
    errorEl.classList.add('md-visible');
  }

  let trackObserver = null;

  function watchTrackChanges() {
    stopWatchingTrack();
    const candidates = [
      '.nowPlayingBarText',
      '.nowPlayingBarInfoText',
      '#nowPlayingBar',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) {
        trackObserver = new MutationObserver(() => {
          if (overlayOpen) trackLabel.innerHTML = getTrackName();
        });
        trackObserver.observe(el, { childList: true, subtree: true, characterData: true });
        break;
      }
    }
  }

  function stopWatchingTrack() {
    if (trackObserver) { trackObserver.disconnect(); trackObserver = null; }
  }

  let hudTimer = null;
  overlay.addEventListener('mousemove', () => {
    hud.classList.add('md-hud-visible');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => hud.classList.remove('md-hud-visible'), 3000);
  });
  overlay.addEventListener('transitionend', () => {
    if (overlayOpen) {
      hud.classList.add('md-hud-visible');
      hudTimer = setTimeout(() => hud.classList.remove('md-hud-visible'), 3000);
    }
  });

  btnPreset.addEventListener('click', randomPreset);

  btnAuto.addEventListener('click', () => {
    if (autoCycle) stopAutoCycle(); else startAutoCycle();
  });

  btnSensUp.addEventListener('click', () => {
    sensitivity = Math.min(5.0, +(sensitivity + 0.2).toFixed(1));
    if (gainNode) gainNode.gain.value = sensitivity;
    sensLabel.textContent = `SENS ${sensitivity.toFixed(1)}Ã—`;
  });

  btnSensDown.addEventListener('click', () => {
    sensitivity = Math.max(0.2, +(sensitivity - 0.2).toFixed(1));
    if (gainNode) gainNode.gain.value = sensitivity;
    sensLabel.textContent = `SENS ${sensitivity.toFixed(1)}Ã—`;
  });

  btnClose.addEventListener('click', closeVisualiser);
  btnErrClose.addEventListener('click', closeVisualiser);

  document.addEventListener('keydown', e => {
    if (!overlayOpen) return;
    if (e.key === 'Escape')       closeVisualiser();
    if (e.key === 'n' || e.key === 'N') randomPreset();
    if (e.key === 'a' || e.key === 'A') {
      if (autoCycle) stopAutoCycle(); else startAutoCycle();
    }
    if (e.key === 'ArrowRight')   { sensitivity = Math.min(5.0, +(sensitivity + 0.2).toFixed(1)); if (gainNode) gainNode.gain.value = sensitivity; sensLabel.textContent = `SENS ${sensitivity.toFixed(1)}Ã—`; }
    if (e.key === 'ArrowLeft')    { sensitivity = Math.max(0.2, +(sensitivity - 0.2).toFixed(1)); if (gainNode) gainNode.gain.value = sensitivity; sensLabel.textContent = `SENS ${sensitivity.toFixed(1)}Ã—`; }
  });

  window.addEventListener('resize', resizeCanvas);

  let triggerBtn = null;

  function injectButton() {
    if (document.getElementById('md-trigger-btn')) return;
    const barSelectors = [
      '.nowPlayingBarButtons',
      '.nowPlayingBar .buttons',
      '#nowPlayingBar .buttons',
      '.footer .nowPlayingBar',
      '.nowPlayingBarRight',
      '.nowPlayingBar',
      '[class*="nowPlayingBar"]',
    ];

    let bar = null;
    for (const sel of barSelectors) {
      bar = document.querySelector(sel);
      if (bar) break;
    }

    if (!bar) return false;

    triggerBtn = document.createElement('button');
    triggerBtn.id = 'md-trigger-btn';
    triggerBtn.title = 'MilkDrop Visualiser (N=next preset, A=auto, Esc=close)';
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
        <path d="M3 9l18-3" stroke-dasharray="2 2" opacity="0.4"/>
      </svg>
      VISUALISER
    `;
    triggerBtn.addEventListener('click', () => {
      if (overlayOpen) closeVisualiser(); else openVisualiser();
    });

    const firstBtn = bar.querySelector('button');
    if (firstBtn) {
      bar.insertBefore(triggerBtn, firstBtn);
    } else {
      bar.appendChild(triggerBtn);
    }

    console.log('[MilkDrop] Button injected into now-playing bar âœ“');
    return true;
  }

  function waitForBar() {
    if (injectButton()) return;

    console.log('[MilkDrop] Waiting for Jellyfin now-playing bar...');

    const observer = new MutationObserver(() => {
      if (injectButton()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', () => setTimeout(injectButton, 500));

    let attempts = 0;
    const poll = setInterval(() => {
      if (injectButton() || ++attempts > 60) clearInterval(poll);
    }, 500);
  }

  const reInjectObserver = new MutationObserver(() => {
    if (!document.getElementById('md-trigger-btn')) {
      setTimeout(injectButton, 100);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body && reInjectObserver.observe(document.body, { childList: true, subtree: true });
      waitForBar();
    });
  } else {
    reInjectObserver.observe(document.body, { childList: true, subtree: true });
    waitForBar();
  }

  console.log('[MilkDrop] Jellyfin MilkDrop Visualiser loaded âœ“');

})();
