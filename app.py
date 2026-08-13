import os
import re
from urllib.parse import unquote, urlparse, urljoin
from flask import Flask, request, Response, send_from_directory
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}


def rewrite_m3u8(content: str, original_url: str) -> str:
    """Rewrites relative segment and playlist URLs inside m3u8 file to pass through proxy."""
    base_dir = original_url.rsplit('/', 1)[0] + '/'

    lines = content.splitlines()
    out = []

    for line in lines:
        s = line.strip()
        if not s:
            out.append(line)
            continue

        if s.startswith('#'):
            # Handle URI in tags like #EXT-X-KEY:METHOD=AES-128,URI="..."
            def replace_uri(m):
                u = m.group(1)
                full = urljoin(base_dir, u)
                return f'URI="/proxy?url={requests.utils.quote(full)}"'

            line = re.sub(r'URI="([^"]+)"', replace_uri, line)
            out.append(line)
        else:
            # Media segment or sub-playlist URL
            full_url = urljoin(base_dir, s)
            proxied = f'/proxy?url={requests.utils.quote(full_url)}'
            out.append(proxied)

    return "\n".join(out)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/proxy')
def proxy():
    raw_url = request.args.get('url', '')
    if not raw_url:
        return Response('Missing url parameter', status=400)

    target_url = unquote(raw_url)

    try:
        resp = requests.get(target_url, headers=HEADERS, stream=True, timeout=15)
        content_type = resp.headers.get('Content-Type', '')

        if '.m3u8' in target_url.lower() or 'mpegurl' in content_type.lower():
            text = resp.text
            rewritten = rewrite_m3u8(text, target_url)
            return Response(
                rewritten,
                status=resp.status_code,
                content_type='application/vnd.apple.mpegurl',
                headers={'Access-Control-Allow-Origin': '*'}
            )

        def generate():
            for chunk in resp.iter_content(chunk_size=64 * 1024):
                if chunk:
                    yield chunk

        r = Response(generate(), status=resp.status_code, content_type=content_type)
        r.headers['Access-Control-Allow-Origin'] = '*'
        return r

    except Exception as e:
        return Response(f"Proxy error: {str(e)}", status=500)


if __name__ == '__main__':
    # Render (and most PaaS hosts) inject the port to bind to via the PORT env var.
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"🚀 PlayersMoy Server running at: http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
