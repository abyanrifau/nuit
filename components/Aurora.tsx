"use client";

import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

/*
 * Aurora, adapted from React Bits (https://reactbits.dev). Two drifting
 * curtains of colour driven by simplex noise, one hanging from the top and one
 * rising from the bottom, rendered on a WebGL canvas that fills its container.
 * In light mode the bands tint white instead of glowing on black.
 */

type AuroraProps = {
  /** Colours spread left to right; any count from 2 up to 6. */
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  lightMode?: boolean;
  /** Fraction of the CSS size to render at; the bands are soft so 0.5 is plenty. */
  renderScale?: number;
  className?: string;
};

const vertex = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAmplitude;
  uniform vec3 uColorStops[6];
  uniform float uStopCount;
  uniform vec2 uResolution;
  uniform float uBlend;
  uniform float uLightMode;

  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec3 colorRamp(float factor) {
    // Blend the stops with a circular tent kernel so the ramp is continuous
    // everywhere, including where it wraps from the last stop to the first.
    float n = max(uStopCount, 2.0);
    float pos = fract(factor) * n;
    vec3 col = vec3(0.0);
    float total = 0.0;
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      if (fk >= n) break;
      float d = abs(fract((pos - fk) / n + 0.5) - 0.5) * n;
      float w = max(0.0, 1.0 - d);
      col += uColorStops[k] * w;
      total += w;
    }
    return col / max(total, 0.0001);
  }

  float curtain(vec2 uv, float seed, float drift) {
    float h1 = snoise(vec2(uv.x * 2.0 + uTime * 0.10 * drift + seed, uTime * 0.25 + seed)) * 0.5 * uAmplitude;
    float h2 = snoise(vec2(uv.x * 3.3 - uTime * 0.07 * drift + seed, uTime * 0.18 + seed * 2.0)) * 0.25 * uAmplitude;
    float height = exp(h1 + h2);
    height = uv.y * 1.7 - height + 0.6;
    float intensity = 0.7 * height;
    float midPoint = 0.2;
    float a = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
    return a * smoothstep(1.05, 0.55, uv.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // Colour shifts along the width and slowly over time; the second curtain
    // is offset by half a cycle so the two never share the same hue.
    float drift = uTime * 0.03;
    vec3 colorA = colorRamp(uv.x * 0.9 + drift);
    vec3 colorB = colorRamp(uv.x * 0.9 + 0.5 - drift);

    // One curtain hangs from the top, one rises from the bottom, so the colour
    // reaches through the whole section.
    float top = curtain(vec2(uv.x, 1.0 - uv.y), 0.0, 1.0);
    float bottom = curtain(uv, 7.3, -1.0);

    if (uLightMode > 0.5) {
      // Sharpen each curtain's edge on white so the gaps between bands read
      // as clearly as they do on black.
      float ta = smoothstep(0.12, 0.8, top);
      float ba = smoothstep(0.12, 0.8, bottom);
      vec3 col = vec3(1.0);
      col = mix(col, colorA, ta * 0.92);
      col = mix(col, colorB, ba * 0.92);
      gl_FragColor = vec4(col, 1.0);
    } else {
      // Screen-blend the two curtains so overlaps stay coloured instead of
      // blowing out to white, and keep the glow below full brightness.
      vec3 a = colorA * top;
      vec3 b = colorB * bottom;
      vec3 col = (1.0 - (1.0 - a) * (1.0 - b)) * 0.8;
      float alpha = clamp(top + bottom, 0.0, 1.0);
      gl_FragColor = vec4(col * alpha, alpha);
    }
  }
`;

export default function Aurora({
  colorStops = ["#5b8cff", "#ff6b9a", "#ffd166", "#5ce1a0", "#7ad9ff", "#c084fc"],
  amplitude = 1,
  blend = 0.5,
  speed = 0.6,
  lightMode = false,
  renderScale = 0.5,
  className,
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stopsKey = colorStops.join(",");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      // Reduced resolution, upscaled by the browser: the bands are blurry anyway.
      dpr: Math.min(1, window.devicePixelRatio || 1) * Math.min(1, Math.max(0.25, renderScale)),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    Object.assign(gl.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(gl.canvas);

    const parsed = stopsKey
      .split(",")
      .slice(0, 6)
      .map((hex) => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });
    // Pad to six entries so the uniform array is always fully defined.
    const stops = Array.from({ length: 6 }, (_, i) => parsed[Math.min(i, parsed.length - 1)]);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: stops },
        uStopCount: { value: parsed.length },
        uResolution: { value: [1, 1] },
        uBlend: { value: blend },
        uLightMode: { value: lightMode ? 1 : 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf = 0;
    let running = true;
    const t0 = performance.now();
    let last = 0;
    const FRAME_MS = 1000 / 30; // the drift is slow; 30fps is indistinguishable
    const render = (t: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      if (t - last < FRAME_MS) return;
      last = t;
      program.uniforms.uTime.value = (t - t0) * 0.001 * speed;
      renderer.render({ scene: mesh });
    };

    // Only animate while visible.
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(render);
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(container);
    raf = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [stopsKey, amplitude, blend, speed, lightMode, renderScale]);

  return <div ref={containerRef} className={className ?? "relative h-full w-full"} />;
}
