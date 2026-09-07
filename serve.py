#!/usr/bin/env python3
"""Local preview that mirrors Cloudflare's routing: /solutions serves
public/solutions.html, and unknown paths serve public/404.html.

    python3 serve.py          then open http://localhost:4321
"""
import http.server, os, socketserver, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4321


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        full = super().translate_path(path)
        if os.path.isdir(full):
            index = os.path.join(full, 'index.html')
            if os.path.exists(index):
                return index
        if not os.path.exists(full) and os.path.exists(full + '.html'):
            return full + '.html'
        return full

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
        if code == 404 and os.path.exists(page):
            body = open(page, 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"ABX Intelligence -> http://localhost:{PORT}   (Ctrl+C to stop)")
    httpd.serve_forever()
