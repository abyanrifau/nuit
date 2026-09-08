#!/usr/bin/env python3
"""Local preview server.

Mirrors the `cleanUrls` behaviour configured in vercel.json: a request for
/calculate is served from calculate.html. Without this the extension-less
links the pages use in production would 404 during local preview, so the
dev server and the deployed site would disagree about what works.

    python serve.py [port]        # default 8000
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))


class CleanUrlHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # No caching in local preview. Browsers were holding on to an old styles.css
        # and app.js after a rebuild, which reads as "the fix did not work".
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def translate_path(self, path):
        local = super().translate_path(path)
        if not os.path.exists(local) and not local.endswith(('.html', os.sep, '/')):
            with_ext = local + '.html'
            if os.path.isfile(with_ext):
                return with_ext
        return local


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    ThreadingHTTPServer(('', port), CleanUrlHandler).serve_forever()
