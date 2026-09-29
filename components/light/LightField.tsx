"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { hexToRgb, light, LIGHT_COLORS, MOODS, type MoodName } from "@/lib/light";
import { useAfterIdle } from "@/lib/hooks";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/*
 * The one light layer behind the whole site. A tiny WebGL canvas (an eighth
 * of the screen's resolution, stretched by the browser, which blurs it for
 * free) sums six soft Gaussian fields of prism colour. The fields drift on
 * their own, lean toward the cursor on desktop, and glide to each section's
 * mood as it crosses the middle of the screen.
 *
 * Until WebGL is up (or if it never is) a CSS approximation of the hero mood
 * holds the space, so first paint already has its light.
 */

const vertex = /* glsl */ `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec4 uField[6];
  uniform vec3 uColor[6];
  uniform float uExposure;

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    uv.y = 1.0 - uv.y;
    float aspect = uRes.x / uRes.y;
    float t = uTime;

    // A slow, low-frequency warp so no field is ever a clean circle: the
    // light bends like it has passed through uneven glass.
    vec2 w = uv;
    w += 0.05 * vec2(
      sin(uv.y * 3.1 + t * 0.09) + 0.5 * sin(uv.x * 5.3 - t * 0.05),
      cos(uv.x * 2.7 - t * 0.07) + 0.5 * cos(uv.y * 4.1 + t * 0.06)
    );

    vec3 col = vec3(0.0);
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      vec4 f = uField[k];
      // Each field wanders on its own slow orbit and leans toward the cursor
      // by a different amount, so they part a little as the pointer moves.
      vec2 drift = vec2(
        sin(t * (0.045 + fk * 0.006) + fk * 1.7),
        cos(t * (0.038 + fk * 0.005) + fk * 2.3)
      ) * 0.05;
      vec2 p = f.xy + drift + uPointer * (0.035 + fk * 0.012);
      vec2 d = w - p;
      d.x *= aspect;
      // Long, angled shafts rather than round glows, each turning slowly.
      float stretch = 1.5 + 0.35 * sin(fk * 2.1);
      d = rot(0.5 + fk * 0.9 + 0.12 * sin(t * 0.03 + fk)) * d;
      d *= vec2(1.0 / stretch, stretch * 0.8);
      float breathe = 0.86 + 0.14 * sin(t * 0.07 + fk * 1.3);
      col += uColor[k] * f.w * breathe * exp(-dot(d, d) / (f.z * f.z));
    }
    // Soft roll-off so overlaps never clip, then a little extra chroma so
    // mixed fields stay coloured light instead of greying into fog.
    // On tall, narrow screens every field spans the full width, so the same
    // strengths read as haze; ease them back there.
    float narrow = mix(0.62, 1.0, clamp((aspect - 0.45) / 0.55, 0.0, 1.0));
    col = 1.0 - exp(-col * uExposure * 1.15 * narrow);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = max(mix(vec3(luma), col, 1.35), 0.0);
    gl_FragColor = vec4(vec3(0.043, 0.043, 0.047) + col, 1.0);
  }
`;

const DOWNSCALE = 8;
const FRAME_MS = 1000 / 30;

/** Flatten a mood into the uniform arrays' layout (5 mood fields + focus). */
function moodArrays(name: MoodName) {
  const mood = MOODS[name];
  const field = new Float32Array(24);
  const color = new Float32Array(18);
  mood.fields.forEach(([x, y, r, s, c], i) => {
    field.set([x, y, r, s], i * 4);
    color.set(hexToRgb(LIGHT_COLORS[c]), i * 3);
  });
  return { field, color, exposure: mood.exposure };
}

/** Lets the loading screen know the background light is fully drawn. */
function announceReady() {
  const html = document.documentElement;
  if ("lightReady" in html.dataset) return;
  html.dataset.lightReady = "";
  window.dispatchEvent(new Event("nw:light-ready"));
}

export function LightField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  // The CSS stand-in covers first paint; WebGL starts once the page is idle.
  const idle = useAfterIdle(1200);
  useMoodObserver();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !idle) return;
    const gl = canvas.getContext("webgl", { antialias: false, depth: false, alpha: false, powerPreference: "low-power" });
    // Without WebGL the CSS stand-in is the finished background.
    if (!gl) return announceReady();

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return announceReady();
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(program, "uRes"),
      time: gl.getUniformLocation(program, "uTime"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      field: gl.getUniformLocation(program, "uField"),
      color: gl.getUniformLocation(program, "uColor"),
      exposure: gl.getUniformLocation(program, "uExposure"),
    };

    const reduced = prefersReducedMotion();
    const fine = hasFinePointer();

    // Current values ease toward the target mood each frame.
    const start = moodArrays(light.state.mood);
    const cur = { field: start.field.slice(), color: start.color.slice(), exposure: start.exposure };
    let target = start;
    const focus = { x: 0.5, y: 0.5, s: 0, color: hexToRgb(LIGHT_COLORS.amber) };
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      canvas.width = Math.max(32, Math.ceil(window.innerWidth / DOWNSCALE));
      canvas.height = Math.max(32, Math.ceil(window.innerHeight / DOWNSCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      kick();
    };

    let raf = 0;
    let last = 0;
    let settleFrames = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      if (now - last < FRAME_MS - 1) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;

      // Exponential approach: about two seconds to settle into a new mood.
      const k = 1 - Math.exp(-dt * (reduced ? 6 : 1.5));
      let moving = 0;
      for (let i = 0; i < 20; i++) {
        const d = target.field[i] - cur.field[i];
        cur.field[i] += d * k;
        moving = Math.max(moving, Math.abs(d));
      }
      for (let i = 0; i < 15; i++) {
        const d = target.color[i] - cur.color[i];
        cur.color[i] += d * k;
        moving = Math.max(moving, Math.abs(d));
      }
      cur.exposure += (target.exposure - cur.exposure) * k;

      // The focus light: sixth slot.
      const fs = light.state.focus;
      const kf = 1 - Math.exp(-dt * 3);
      focus.x += (fs.x - focus.x) * kf;
      focus.y += (fs.y - focus.y) * kf;
      focus.s += (fs.strength - focus.s) * kf;
      const fc = hexToRgb(LIGHT_COLORS[fs.color]);
      for (let i = 0; i < 3; i++) focus.color[i] += (fc[i] - focus.color[i]) * kf;
      cur.field.set([focus.x, focus.y, 0.34, focus.s], 20);
      cur.color.set(focus.color, 15);
      moving = Math.max(moving, Math.abs(fs.strength - focus.s));

      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 2.5));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 2.5));

      gl.uniform1f(u.time, reduced ? 0 : (now - t0) / 1000);
      gl.uniform2f(u.pointer, pointer.x, pointer.y);
      gl.uniform4fv(u.field, cur.field);
      gl.uniform3fv(u.color, cur.color);
      gl.uniform1f(u.exposure, cur.exposure);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // With motion on, the fields always drift. With reduced motion, only
      // draw while a mood change is still settling.
      if (!reduced) {
        raf = requestAnimationFrame(frame);
      } else if (moving > 0.0005 || settleFrames-- > 0) {
        raf = requestAnimationFrame(frame);
      }
    };

    function kick() {
      settleFrames = 2;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    // Focus changes are read straight from the store each frame; only a new
    // mood needs its arrays rebuilt.
    let mood = light.state.mood;
    const unsub = light.subscribe((s) => {
      if (s.mood !== mood) {
        mood = s.mood;
        target = moodArrays(mood);
      }
      kick();
    });

    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2 * 0.5;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2 * 0.5;
    };
    if (fine && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    const onVisibility = () => {
      if (!document.hidden) {
        last = 0;
        kick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(frame);
    // Fade the canvas in over the CSS stand-in once it has drawn; it is
    // finished once that fade (1s) is done.
    const fadeIn = requestAnimationFrame(() => setLive(true));
    const settled = window.setTimeout(announceReady, 1000 + 50);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(fadeIn);
      window.clearTimeout(settled);
      unsub();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      // Free the program but keep the context: the same canvas is reused if
      // the effect runs again (React re-runs effects in development).
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [idle]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20">
      {/* CSS stand-in for the hero mood, shown until the canvas is live. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(34vh 30vh at 72% 24%, rgb(148 104 66 / 0.1), transparent 70%)",
            "radial-gradient(40vh 36vh at 50% 62%, rgb(43 102 148 / 0.08), transparent 70%)",
            "radial-gradient(34vh 30vh at 90% 50%, rgb(148 80 67 / 0.08), transparent 70%)",
            "var(--bg)",
          ].join(","),
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-1000"
        style={{ opacity: live ? 1 : 0 }}
      />
    </div>
  );
}

/**
 * Watches every `[data-light]` section on the current page and hands the
 * light the mood of whichever one is crossing the middle of the screen.
 */
function useMoodObserver() {
  const pathname = usePathname();
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const id = requestAnimationFrame(() => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-light]"));
      if (!sections.length) {
        light.setMood("page");
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) light.setMood((e.target as HTMLElement).dataset.light as MoodName);
          }
        },
        // A thin band just above the middle of the screen.
        { rootMargin: "-45% 0px -54% 0px" },
      );
      sections.forEach((s) => io!.observe(s));
    });
    return () => {
      cancelAnimationFrame(id);
      io?.disconnect();
    };
  }, [pathname]);
}
