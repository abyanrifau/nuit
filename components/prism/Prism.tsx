"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { FADE_FROM, REACH, type PrismFrame } from "@/components/prism/prism-frame";
import { warmShader } from "@/lib/warm-shader";

/*
 * The hero prism, carried over unchanged from the previous site (adapted
 * there from React Bits, https://reactbits.dev): a glowing ray-marched prism
 * on a transparent WebGL canvas.
 *
 * Added here, without touching the look:
 *   - `frame`: where the prism sits and how big it is (see prism-frame.ts).
 *     The canvas reaches well past the prism and may extend below its
 *     container; only the faint outer glow thins out with distance inside
 *     the shader, so the canvas edge never shows and the prism is never cut.
 *   - `turn`: a live value (0 to 1) that turns the prism as the hero scrolls
 *     away, so its light sweeps as you leave.
 *   - Adaptive quality: if frames run slow, it renders at fewer pixels.
 *   - The render loop sleeps when settled, off screen, or in a hidden tab.
 */

type PrismProps = {
  height?: number;
  baseWidth?: number;
  animationType?: "rotate" | "hover" | "3drotate";
  glow?: number;
  /** Where the prism sits within the container, and its size. */
  frame: PrismFrame;
  /** Stop the canvas at the container's bottom edge (where the container fades out by then). */
  fitHeight?: boolean;
  noise?: number;
  transparent?: boolean;
  hueShift?: number;
  colorFrequency?: number;
  hoverStrength?: number;
  inertia?: number;
  bloom?: number;
  suspendWhenOffscreen?: boolean;
  timeScale?: number;
  /** Fraction of the CSS size to render at (0.25 to 1). */
  renderScale?: number;
  /** Scroll turn, read every frame; call `kick` after changing it. */
  turn?: { value: number; kick?: () => void };
  /** Called once the first frame has been drawn. */
  onReady?: () => void;
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

  uniform vec2  iResolution;
  uniform float iTime;
  uniform float uHeight;
  uniform float uBaseHalf;
  uniform mat3  uRot;
  uniform int   uUseBaseWobble;
  uniform float uGlow;
  uniform float uNoise;
  uniform float uSaturation;
  uniform float uHueShift;
  uniform float uColorFreq;
  uniform float uBloom;
  uniform float uCenterShift;
  uniform float uInvBaseHalf;
  uniform float uInvHeight;
  uniform float uMinAxis;
  uniform float uPxScale;
  uniform vec2  uOrigin;
  uniform float uTimeScale;

  vec4 tanh4(vec4 x){
    vec4 e2x = exp(2.0*x);
    return (e2x - 1.0) / (e2x + 1.0);
  }

  float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float sdOctaAnisoInv(vec3 p){
    vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
    float m = q.x + q.y + q.z - 1.0;
    return m * uMinAxis * 0.5773502691896258;
  }

  float sdPyramidUpInv(vec3 p){
    float oct = sdOctaAnisoInv(p);
    float halfSpace = -p.y;
    return max(oct, halfSpace);
  }

  mat3 hueRotation(float a){
    float c = cos(a), s = sin(a);
    mat3 W = mat3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114);
    mat3 U = mat3(0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.300, -0.588, 0.886);
    mat3 V = mat3(0.168, -0.331, 0.500, 0.328, 0.035, -0.500, -0.497, 0.296, 0.201);
    return W + U * c + V * s;
  }

  void main(){
    vec2 f = (gl_FragCoord.xy - uOrigin) * uPxScale;
    float z = 5.0;
    float d = 0.0;
    vec3 p;
    vec4 o = vec4(0.0);
    float centerShift = uCenterShift;
    float cf = uColorFreq;

    mat2 wob = mat2(1.0);
    if (uUseBaseWobble == 1) {
      float t = iTime * uTimeScale;
      float c0 = cos(t + 0.0);
      float c1 = cos(t + 33.0);
      float c2 = cos(t + 11.0);
      wob = mat2(c0, c1, c2, c0);
    }

    const int STEPS = 64;
    for (int i = 0; i < STEPS; i++) {
      p = vec3(f, z);
      p.xz = p.xz * wob;
      p = uRot * p;
      vec3 q = p;
      q.y += centerShift;
      d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
      z -= d;
      o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
    }

    o = tanh4(o * o * (uGlow * uBloom) / 1e5);

    vec3 col = o.rgb;
    float n = rand(gl_FragCoord.xy + vec2(iTime));
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);

    float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

    if (abs(uHueShift) > 0.0001) {
      col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
    }

    // A natural falloff with distance. The prism and its glow stay within
    // about 2.65 units of the origin in any orientation, so they are never
    // touched; only the faint outer haze thins to nothing before the edge.
    float fall = 1.0 - smoothstep(${FADE_FROM.toFixed(2)}, ${(REACH - 0.05).toFixed(2)}, length(f));
    gl_FragColor = vec4(col, o.a * fall);
  }
`;

export default function Prism({
  height = 3.5,
  baseWidth = 5.5,
  animationType = "rotate",
  glow = 1,
  frame,
  fitHeight = false,
  noise = 0.5,
  transparent = true,
  hueShift = 0,
  colorFrequency = 1,
  hoverStrength = 2,
  inertia = 0.05,
  bloom = 1,
  suspendWhenOffscreen = false,
  timeScale = 0.5,
  renderScale = 0.5,
  turn,
  onReady,
  className,
}: PrismProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  // The frame changes with the layout; it is applied without restarting the shader.
  const frameRef = useRef(frame);
  const relayoutRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    frameRef.current = frame;
    relayoutRef.current?.();
  }, [frame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;
    const init = () => {
      const H = Math.max(0.001, height);
      const BW = Math.max(0.001, baseWidth);
      const BASE_HALF = BW * 0.5;
      const GLOW = Math.max(0, glow);
      const NOISE = Math.max(0, noise);
      const SAT = transparent ? 1.5 : 1;
      const HUE = hueShift || 0;
      const CFREQ = Math.max(0, colorFrequency || 1);
      const BLOOM = Math.max(0, bloom || 1);
      const TS = Math.max(0, timeScale || 1);
      const HOVSTR = Math.max(0, hoverStrength || 1);
      const INERT = Math.max(0, Math.min(1, inertia || 0.12));

      // Render at a reduced resolution and let the browser upscale the canvas.
      let dpr = Math.min(1, window.devicePixelRatio || 1) * Math.min(1, Math.max(0.25, renderScale));
      const renderer = new Renderer({
        dpr,
        alpha: transparent,
        antialias: false,
        powerPreference: "high-performance",
      });
      const gl = renderer.gl;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);

      Object.assign(gl.canvas.style, { position: "absolute", display: "block" });
      container.appendChild(gl.canvas);

      const geometry = new Triangle(gl);
      const iResBuf = new Float32Array(2);
      const originBuf = new Float32Array(2);

      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          iResolution: { value: iResBuf },
          iTime: { value: 0 },
          uHeight: { value: H },
          uBaseHalf: { value: BASE_HALF },
          uUseBaseWobble: { value: 1 },
          uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
          uGlow: { value: GLOW },
          uNoise: { value: NOISE },
          uSaturation: { value: SAT },
          uHueShift: { value: HUE },
          uColorFreq: { value: CFREQ },
          uBloom: { value: BLOOM },
          uCenterShift: { value: H * 0.25 },
          uInvBaseHalf: { value: 1 / BASE_HALF },
          uInvHeight: { value: 1 / H },
          uMinAxis: { value: Math.min(BASE_HALF, H) },
          uPxScale: { value: 1 },
          uOrigin: { value: originBuf },
          uTimeScale: { value: TS },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        // The canvas covers REACH units around the origin, trimmed to the
        // page's width (beyond it nothing shows) and to the top of the page.
        // Downward it runs on past the container, unless asked to stop there.
        const { cx, cy, unit } = frameRef.current;
        const r = REACH * unit;
        const left = Math.max(0, Math.floor(cx - r));
        const right = Math.min(container.clientWidth || 1, Math.ceil(cx + r));
        const top = Math.max(0, Math.floor(cy - r));
        const bottom = fitHeight ? Math.min(Math.ceil(cy + r), container.clientHeight || 1) : Math.ceil(cy + r);
        const w = Math.max(1, right - left);
        const h = Math.max(1, bottom - top);
        renderer.dpr = dpr;
        renderer.setSize(w, h);
        Object.assign(gl.canvas.style, { left: `${left}px`, top: `${top}px` });
        iResBuf[0] = gl.drawingBufferWidth;
        iResBuf[1] = gl.drawingBufferHeight;
        // Drawing-buffer pixels per CSS pixel, then the origin in buffer
        // coordinates (which count up from the bottom).
        const sx = gl.drawingBufferWidth / w;
        const sy = gl.drawingBufferHeight / h;
        originBuf[0] = (cx - left) * sx;
        originBuf[1] = (bottom - cy) * sy;
        program.uniforms.uPxScale.value = 1 / (unit * sy);
        startRAF();
      };
      relayoutRef.current = resize;
      const ro = new ResizeObserver(resize);

      const rotBuf = new Float32Array(9);
      const setMat3FromEuler = (yawY: number, pitchX: number, rollZ: number, out: Float32Array) => {
        const cy = Math.cos(yawY),
          sy = Math.sin(yawY);
        const cx = Math.cos(pitchX),
          sx = Math.sin(pitchX);
        const cz = Math.cos(rollZ),
          sz = Math.sin(rollZ);
        out[0] = cy * cz + sy * sx * sz;
        out[1] = cx * sz;
        out[2] = -sy * cz + cy * sx * sz;
        out[3] = -cy * sz + sy * sx * cz;
        out[4] = cx * cz;
        out[5] = sy * sz + cy * sx * cz;
        out[6] = sy * cx;
        out[7] = -sx;
        out[8] = cy * cx;
        return out;
      };

      const NOISE_IS_ZERO = NOISE < 1e-6;
      let raf = 0;
      let visible = true;
      const t0 = performance.now();

      const rnd = () => Math.random();
      const wX = 0.3 + rnd() * 0.6;
      const wY = 0.2 + rnd() * 0.7;
      const wZ = 0.1 + rnd() * 0.5;
      const phX = rnd() * Math.PI * 2;
      const phZ = rnd() * Math.PI * 2;

      let yaw = 0,
        pitch = 0,
        roll = 0;
      let targetYaw = 0,
        targetPitch = 0;
      let turnEased = turn?.value ?? 0;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const pointer = { x: 0, y: 0, inside: true };

      // Adaptive quality: watch the first frames; if they run slow, drop
      // resolution (at most twice). The glow is soft, so it barely shows.
      let sampleStart = 0;
      let samples = 0;
      let downgrades = 0;
      let ready = false;

      const render = (t: number) => {
        const time = (t - t0) * 0.001;
        program.uniforms.iTime.value = time;
        let continueRAF = true;

        // The scroll turn eases in, so a fast flick still reads as a turn.
        const turnTarget = turn?.value ?? 0;
        turnEased = lerp(turnEased, turnTarget, 0.12);
        const turnYaw = turnEased * 1.1;
        const turnPitch = turnEased * 0.35;
        const turnMoving = Math.abs(turnEased - turnTarget) > 1e-4;

        if (animationType === "hover") {
          const maxPitch = 0.6 * HOVSTR;
          const maxYaw = 0.6 * HOVSTR;
          targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
          targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
          yaw = lerp(yaw, targetYaw, INERT);
          pitch = lerp(pitch, targetPitch, INERT);
          roll = lerp(roll, 0, 0.1);
          program.uniforms.uRot.value = setMat3FromEuler(yaw + turnYaw, pitch + turnPitch, roll, rotBuf);
          if (NOISE_IS_ZERO) {
            const settled =
              Math.abs(yaw - targetYaw) < 1e-4 &&
              Math.abs(pitch - targetPitch) < 1e-4 &&
              Math.abs(roll) < 1e-4 &&
              !turnMoving;
            if (settled) continueRAF = false;
          }
        } else if (animationType === "3drotate") {
          const tScaled = time * TS;
          yaw = tScaled * wY;
          pitch = Math.sin(tScaled * wX + phX) * 0.6;
          roll = Math.sin(tScaled * wZ + phZ) * 0.5;
          program.uniforms.uRot.value = setMat3FromEuler(yaw + turnYaw, pitch + turnPitch, roll, rotBuf);
          if (TS < 1e-6 && !turnMoving) continueRAF = false;
        } else {
          rotBuf.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
          program.uniforms.uRot.value = rotBuf;
          if (TS < 1e-6) continueRAF = false;
        }

        renderer.render({ scene: mesh });

        if (!ready) {
          ready = true;
          onReadyRef.current?.();
        }
        if (downgrades < 2) {
          if (!sampleStart) sampleStart = t;
          else if (++samples === 45) {
            const avg = (t - sampleStart) / samples;
            if (avg > 24 && dpr > 0.2) {
              dpr *= 0.72;
              downgrades++;
              resize();
            } else {
              downgrades = 2;
            }
            sampleStart = 0;
            samples = 0;
          }
        }

        raf = continueRAF ? requestAnimationFrame(render) : 0;
      };

      const startRAF = () => {
        if (raf || !visible) return;
        raf = requestAnimationFrame(render);
      };
      const stopRAF = () => {
        if (!raf) return;
        cancelAnimationFrame(raf);
        raf = 0;
        sampleStart = 0;
        samples = 0;
      };
      if (turn) turn.kick = startRAF;

      const onMove = (e: PointerEvent) => {
        const ww = Math.max(1, window.innerWidth);
        const wh = Math.max(1, window.innerHeight);
        pointer.x = Math.max(-1, Math.min(1, (e.clientX - ww * 0.5) / (ww * 0.5)));
        pointer.y = Math.max(-1, Math.min(1, (e.clientY - wh * 0.5) / (wh * 0.5)));
        pointer.inside = true;
        startRAF();
      };
      const onLeave = () => {
        pointer.inside = false;
        startRAF();
      };

      // Touch screens have no hover, so the prism drifts on its own there.
      const canHover = window.matchMedia("(hover: hover)").matches;
      if (animationType === "hover" && canHover) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("blur", onLeave);
        program.uniforms.uUseBaseWobble.value = 0;
      } else if (animationType === "3drotate") {
        program.uniforms.uUseBaseWobble.value = 0;
      } else {
        program.uniforms.uUseBaseWobble.value = 1;
      }

      let io: IntersectionObserver | null = null;
      if (suspendWhenOffscreen) {
        io = new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) startRAF();
          else stopRAF();
        });
        io.observe(container);
      }
      ro.observe(container);
      resize();

      return () => {
        relayoutRef.current = undefined;
        stopRAF();
        ro.disconnect();
        io?.disconnect();
        if (turn) turn.kick = undefined;
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("blur", onLeave);
        if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    };

    void warmShader(vertex, fragment).then(() => {
      if (!cancelled) teardown = init();
    });
    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [
    height,
    baseWidth,
    animationType,
    glow,
    noise,
    fitHeight,
    transparent,
    hueShift,
    colorFrequency,
    timeScale,
    hoverStrength,
    inertia,
    bloom,
    suspendWhenOffscreen,
    renderScale,
    turn,
  ]);

  return <div ref={containerRef} className={className ?? "relative h-full w-full"} />;
}
