#!/usr/bin/env python3
"""Drives headless Chrome via the DevTools protocol to capture a hero
screenshot only once fonts and every on-screen <img>/background-image have
actually finished loading. Not part of the site — a build tool for the
concept-card covers in assets/*.jpg (see index.html's #work section).

A plain `chrome --headless --screenshot` fires as soon as the load event
does, which is well before web fonts or images that load asynchronously
have painted — that produced the blank/placeholder card covers this
script exists to avoid. This polls the live page instead of guessing a
fixed delay.

Requires: pip install websocket-client
Usage:    python shot.py <url> <out.png> [width] [height]
"""
import base64
import json
import subprocess
import sys
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def main():
    url = sys.argv[1]
    out = sys.argv[2]
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
    height = int(sys.argv[4]) if len(sys.argv) > 4 else 1000
    port = 9333

    proc = subprocess.Popen([
        CHROME, "--headless=new", "--disable-gpu",
        f"--remote-debugging-port={port}",
        "--remote-allow-origins=*",
        f"--window-size={width},{height}",
        "--hide-scrollbars", "--no-first-run",
        "--user-data-dir=" + out.rsplit(".", 1)[0] + "-profile",
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        # Wait for the debugger to accept connections, then use the default page
        # target headless Chrome opens at startup rather than /json/new (that
        # endpoint's query-string form for a start URL is gone in current Chrome).
        target = None
        for _ in range(50):
            try:
                targets = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list").read())
                target = next((t for t in targets if t.get("type") == "page"), None)
                if target:
                    break
            except Exception:
                pass
            time.sleep(0.2)
        if target is None:
            raise RuntimeError("Chrome DevTools endpoint never came up")

        ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=30)
        msg_id = 0

        def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            return msg_id

        def recv_until(target_id, timeout=30):
            deadline = time.time() + timeout
            while time.time() < deadline:
                ws.settimeout(max(0.1, deadline - time.time()))
                try:
                    raw = ws.recv()
                except Exception:
                    break
                data = json.loads(raw)
                if data.get("id") == target_id:
                    return data
            raise TimeoutError(f"No response to message {target_id}")

        send("Page.enable")
        recv_until(msg_id)
        send("Runtime.enable")
        recv_until(msg_id)
        send("Emulation.setDeviceMetricsOverride", {
            "width": width, "height": height, "deviceScaleFactor": 1, "mobile": False,
        })
        recv_until(msg_id)

        nav_id = send("Page.navigate", {"url": url})
        recv_until(nav_id)

        # Poll the page itself: fonts ready, every <img> complete, and every element
        # with a CSS background-image actually painted (some sites fade a photo in
        # via a background-image set after a fetch, not an <img> tag).
        check_js = rf"""
        (async () => {{
          try {{ await document.fonts.ready; }} catch (e) {{}}
          // Only elements actually on screen right now — a carousel's off-stage
          // slides (display fine, positioned outside the viewport or opacity:0)
          // legitimately never load until their turn, and should not block this.
          const onScreen = (el) => {{
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width > 40 && r.height > 20 && r.right > 0 && r.bottom > 0 &&
                   r.left < {width} && r.top < {height} &&
                   cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
          }};
          const imgs = [...document.images].filter(onScreen);
          const imgsOk = imgs.every(i => i.complete && i.naturalWidth > 0);
          const bgEls = [...document.querySelectorAll('*')].filter(el => {{
            const cs = getComputedStyle(el);
            return cs.backgroundImage && cs.backgroundImage !== 'none' && onScreen(el);
          }}).slice(0, 40);
          let bgOk = true;
          for (const el of bgEls) {{
            const m = getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (!m) continue;
            const ok = await new Promise((res) => {{
              const im = new Image();
              im.onload = () => res(true);
              im.onerror = () => res(true); // do not block forever on a failed fetch
              im.src = m[1];
              if (im.complete) res(true);
            }});
            if (!ok) bgOk = false;
          }}
          return JSON.stringify({{imgsOk, imgCount: imgs.length, bgOk, bgCount: bgEls.length}});
        }})()
        """

        ready = False
        last = None
        for attempt in range(40):  # up to ~20s of polling
            ev_id = send("Runtime.evaluate", {"expression": check_js, "awaitPromise": True, "returnByValue": True})
            resp = recv_until(ev_id, timeout=10)
            try:
                last = json.loads(resp["result"]["result"]["value"])
                if last["imgsOk"] and last["bgOk"]:
                    ready = True
                    break
            except Exception:
                pass
            time.sleep(0.5)

        # A short settle beyond "loaded" for CSS transitions/fade-ins to finish.
        time.sleep(1.2)

        shot_id = send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        resp = recv_until(shot_id, timeout=20)
        data = resp["result"]["data"]
        with open(out, "wb") as f:
            f.write(base64.b64decode(data))

        print(f"{out}: ready={ready} last={last}")
        ws.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    main()
