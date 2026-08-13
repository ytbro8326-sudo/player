# 🎬 PlayersMoy — Standalone HLS / M3U8 Player Package

A clean, modern, high-performance HTML5 HLS & M3U8 video player package built with **hls.js** and zero heavy framework overhead.

---

## 📁 Package Structure

```text
playersmoy/
├── index.html        # Main standalone Web UI
├── styles.css        # Modern sleek dark theme styles
├── player.js         # HLS engine initialization, shortcuts & UI events
├── server.py         # Python Flask backend server with built-in CORS stream proxy
├── requirements.txt  # Python dependencies (Flask, requests, gunicorn)
├── Procfile           # Process definition for Render/Heroku-style hosts
├── render.yaml        # Render Blueprint (infra-as-code) for one-click deploy
├── .gitignore
└── README.md          # Quickstart documentation
```

---

## 🚀 How to Run

### Method 1: Direct File Open (Static Mode)
Double-click [`index.html`](index.html) or open it in any web browser. You can play direct `.m3u8` or `.mp4` URLs that allow cross-origin requests (CORS).

### Method 2: With CORS Proxy Server (Recommended for restricted streams)
To play stream links with CORS or Referer protection:

1. Install Python dependencies (if not already installed):
   ```bash
   pip install flask requests
   ```
2. Launch the backend server:
   ```bash
   python server.py
   ```
3. Open `http://127.0.0.1:5000` in your browser.

---

## ☁️ Deploying to Render

This package ships ready for [Render](https://render.com) as a **Web Service**.

### Option A — Blueprint (one-click, uses `render.yaml`)
1. Push this folder to a GitHub/GitLab repo.
2. In Render, click **New +** → **Blueprint**, and select the repo. Render reads `render.yaml` and configures everything automatically.
3. Click **Apply** — Render builds and deploys the service.

### Option B — Manual Web Service
1. Push this folder to a GitHub/GitLab repo.
2. In Render, click **New +** → **Web Service**, and connect the repo.
3. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app --workers 2 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`
4. Click **Create Web Service**. Render assigns a public URL (e.g. `https://playersmoy.onrender.com`).

### Notes for production
- `server.py` now reads the port from the `PORT` environment variable (Render sets this automatically) instead of hardcoding `5000`.
- The app runs behind **gunicorn** in production rather than Flask's built-in dev server. `--threads 4` lets the `/proxy` route stream multiple concurrent segment requests without blocking.
- Flask debug mode is off by default; set `FLASK_DEBUG=true` as an env var only for local troubleshooting — never in production, since debug mode exposes an interactive debugger/reverse shell if an error is triggered.
- The stream proxy (`/proxy`) fetches whatever URL a user supplies server-side. If you expose this publicly, be aware it can be used as an open proxy/SSRF vector — consider adding an allowlist of permitted domains or requiring auth before making this public-facing.

---

## ✨ Features
* 📡 **HLS / M3U8 Adaptive Streaming** (Auto quality detection & selector)
* 🎞️ **Direct MP4 & IFrame Embed Support**
* ⚡ **Keyboard Shortcuts**:
  * `Space` / `K` — Play / Pause
  * `F` — Toggle Fullscreen
  * `M` — Mute / Unmute
  * `←` / `→` — Seek ±5 Seconds
  * `↑` / `↓` — Volume Up / Down
* 🔄 **Built-in Stream CORS Proxy Handler**
