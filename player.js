class PlayersMoy {
  constructor() {
    this.hls = null;
    this.currentUrl = '';
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.vwrap = document.getElementById('vwrap');
    this.vid = document.getElementById('vid');
    this.iframeWrap = document.getElementById('iframeWrap');
    this.iframePlayer = document.getElementById('iframePlayer');
    this.modeBadge = document.getElementById('modeBadge');

    // Controls
    this.btnPlay = document.getElementById('btnPlay');
    this.btnBack = document.getElementById('btnBack');
    this.btnFwd = document.getElementById('btnFwd');
    this.btnMute = document.getElementById('btnMute');
    this.volSlider = document.getElementById('volSlider');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.seekContainer = document.getElementById('seekContainer');
    this.seekBuf = document.getElementById('seekBuf');
    this.seekProg = document.getElementById('seekProg');
    this.seekThumb = document.getElementById('seekThumb');
    this.qualSelect = document.getElementById('qualSelect');
    this.speedSelect = document.getElementById('speedSelect');
    this.btnFullscreen = document.getElementById('btnFullscreen');

    // Panel
    this.urlInput = document.getElementById('urlInput');
    this.proxySelect = document.getElementById('proxySelect');
    this.btnLoad = document.getElementById('btnLoad');
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
  }

  bindEvents() {
    // Video events
    this.vid.addEventListener('play', () => this.updatePlayBtn(true));
    this.vid.addEventListener('pause', () => this.updatePlayBtn(false));
    this.vid.addEventListener('timeupdate', () => this.updateProgress());
    this.vid.addEventListener('progress', () => this.updateBuffer());

    // Controls
    this.btnPlay.addEventListener('click', () => this.togglePlay());
    this.btnBack.addEventListener('click', () => this.seekBy(-10));
    this.btnFwd.addEventListener('click', () => this.seekBy(10));
    this.btnMute.addEventListener('click', () => this.toggleMute());
    this.volSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

    // Seek bar drag/click
    this.seekContainer.addEventListener('click', (e) => this.seekToPosition(e));

    // Selectors
    this.speedSelect.addEventListener('change', (e) => {
      this.vid.playbackRate = parseFloat(e.target.value);
    });

    this.qualSelect.addEventListener('change', (e) => {
      if (this.hls) {
        this.hls.currentLevel = parseInt(e.target.value);
      }
    });

    this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

    // Panel buttons
    this.btnLoad.addEventListener('click', () => {
      const url = this.urlInput.value.trim();
      if (url) this.loadStream(url);
    });

    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = this.urlInput.value.trim();
        if (url) this.loadStream(url);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          this.toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          this.seekBy(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          this.seekBy(5);
          break;
        case 'arrowup':
          e.preventDefault();
          this.adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          this.adjustVolume(-0.1);
          break;
      }
    });
  }

  setStatus(msg, type = 'normal') {
    this.statusText.textContent = msg;
    this.statusDot.className = 'status-dot';
    if (type === 'success') this.statusDot.classList.add('active');
    if (type === 'error') this.statusDot.classList.add('error');
  }

  formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updatePlayBtn(isPlaying) {
    this.btnPlay.textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
      this.vwrap.classList.remove('paused');
    } else {
      this.vwrap.classList.add('paused');
    }
  }

  togglePlay() {
    if (this.vid.paused) {
      this.vid.play().catch(err => {
        this.setStatus(`Autoplay error: ${err.message}`, 'error');
      });
    } else {
      this.vid.pause();
    }
  }

  toggleMute() {
    this.vid.muted = !this.vid.muted;
    this.btnMute.textContent = this.vid.muted || this.vid.volume === 0 ? '🔇' : '🔊';
    this.volSlider.value = this.vid.muted ? 0 : this.vid.volume;
  }

  setVolume(val) {
    this.vid.volume = parseFloat(val);
    this.vid.muted = this.vid.volume === 0;
    this.btnMute.textContent = this.vid.muted ? '🔇' : '🔊';
  }

  adjustVolume(delta) {
    let newVol = Math.min(1, Math.max(0, this.vid.volume + delta));
    this.setVolume(newVol);
    this.volSlider.value = newVol;
  }

  seekBy(seconds) {
    this.vid.currentTime = Math.min(this.vid.duration || 0, Math.max(0, this.vid.currentTime + seconds));
  }

  seekToPosition(e) {
    const rect = this.seekContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (this.vid.duration) {
      this.vid.currentTime = pos * this.vid.duration;
    }
  }

  updateProgress() {
    if (!this.vid.duration) return;
    const pct = (this.vid.currentTime / this.vid.duration) * 100;
    this.seekProg.style.width = `${pct}%`;
    this.seekThumb.style.left = `${pct}%`;
    this.timeDisplay.textContent = `${this.formatTime(this.vid.currentTime)} / ${this.formatTime(this.vid.duration)}`;
  }

  updateBuffer() {
    if (!this.vid.duration || !this.vid.buffered.length) return;
    const bufferedEnd = this.vid.buffered.end(this.vid.buffered.length - 1);
    const pct = (bufferedEnd / this.vid.duration) * 100;
    this.seekBuf.style.width = `${pct}%`;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.vwrap.requestFullscreen().catch(err => alert(`Error entering fullscreen: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  }

  resolveProxyUrl(url) {
    const proxyMode = this.proxySelect.value;
    if (proxyMode === 'direct') return url;
    if (proxyMode === 'local') return `/proxy?url=${encodeURIComponent(url)}`;
    if (proxyMode === 'corsproxy') return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    return url;
  }

  loadStream(targetUrl) {
    this.currentUrl = targetUrl;
    this.urlInput.value = targetUrl;

    // Destroy existing HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Reset quality dropdown
    this.qualSelect.innerHTML = '<option value="-1">Auto Quality</option>';

    const proxied = this.resolveProxyUrl(targetUrl);
    const isM3U8 = targetUrl.includes('.m3u8') || targetUrl.endsWith('.m3u8');
    const isMp4 = targetUrl.endsWith('.mp4') || targetUrl.includes('.mp4');

    if (isM3U8) {
      this.showVideoMode('HLS / M3U8');
      if (Hls.isSupported()) {
        this.setStatus('Initializing HLS Engine...', 'normal');
        this.hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false
        });

        this.hls.loadSource(proxied);
        this.hls.attachMedia(this.vid);

        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          this.setStatus(`✅ Playing M3U8 Stream (${data.levels.length} levels available)`, 'success');
          
          data.levels.forEach((lvl, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = lvl.height ? `${lvl.height}p` : `Level ${idx}`;
            this.qualSelect.appendChild(opt);
          });

          this.vid.play().catch(() => {
            this.setStatus('Autoplay muted by browser. Click Play button.', 'normal');
          });
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                this.setStatus('❌ Network error loading HLS stream. Try Proxy Mode.', 'error');
                this.hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                this.setStatus('⚠️ Media Error — Attempting recovery...', 'normal');
                this.hls.recoverMediaError();
                break;
              default:
                this.setStatus(`❌ Stream Error: ${data.details}`, 'error');
                this.hls.destroy();
                break;
            }
          }
        });
      } else if (this.vid.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        this.vid.src = proxied;
        this.vid.play();
        this.setStatus('✅ Playing Native Safari HLS', 'success');
      } else {
        this.setStatus('❌ HLS is not supported in this browser.', 'error');
      }
    } else if (isMp4) {
      this.showVideoMode('MP4 Direct');
      this.vid.src = proxied;
      this.vid.play().then(() => {
        this.setStatus('✅ Playing Direct MP4 Stream', 'success');
      }).catch(err => {
        this.setStatus(`❌ MP4 Playback error: ${err.message}`, 'error');
      });
    } else {
      // Iframe fallback for embed links
      this.showIframeMode(targetUrl);
    }
  }

  showVideoMode(label) {
    this.iframeWrap.style.display = 'none';
    this.vid.style.display = 'block';
    this.modeBadge.textContent = label;
  }

  showIframeMode(embedUrl) {
    this.vid.style.display = 'none';
    this.iframeWrap.style.display = 'block';
    this.iframePlayer.src = embedUrl;
    this.modeBadge.textContent = 'IFrame Embed';
    this.setStatus('✅ Embedded Page Loaded in IFrame', 'success');
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.playersmoy = new PlayersMoy();
});
