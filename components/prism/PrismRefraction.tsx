"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

/*
 * The prism in the homepage call to action, with the glass from the
 * previous site's contact section: a ray-traced, translucent triangular
 * prism with soft edges and coloured light moving inside it, slowly turning
 * in space.
 *
 * A thin shaft of white light arrives from the top right, enters one face,
 * bends inside the glass toward the prism's base, and leaves through another
 * face as a soft spectrum that fans out as it travels, landing on the
 * call-to-action button. Red is bent the least and violet the most.
 *
 * The light path is solved from the layout. The prism sits level with the
 * word marked `data-prism-level` (the "project" line of the headline) and
 * the light lands on `data-prism-target` (the button). Working back from the
 * landing spot at minimum deviation fixes the angle the light leaves at, the
 * angle it arrives at, and how the glass is turned, so the path stays right
 * at every screen size.
 *
 * Everything is drawn on one WebGL canvas. The sequence scrubs with the
 * scroll as the section arrives, and holds once it has played.
 */

/** The canvas reaches above the panel so the beam can arrive from off screen. */
const OVER_TOP = "42vh";
/* Generous room below, faded out by the host's mask, so the spectrum's tail
   always dissolves into the black rather than meeting the canvas edge. */
const OVER_BOTTOM = "36vh";

/** Minimum deviation through a 60° prism of refractive index n. */
const deviation = (n: number) => 2 * Math.asin(n * Math.sin(Math.PI / 6)) - Math.PI / 3;
// Refractive indices for the two ends of the spectrum and its middle. The
// spread is wider than real glass, so the colours separate at this scale.
const N_RED = 1.38;
const N_MID = 1.44;
const N_VIOLET = 1.5;
const D_MID = deviation(N_MID);
const SPREAD = deviation(N_VIOLET) - deviation(N_RED);

/*
 * The glass is ray-traced in its own units: a triangle with inradius 0.75,
 * seen through a camera at z = 3.2. Its middle slice appears on screen at
 * 0.94 of the size uniform (its front face at about 1.15), which is what the
 * 2D light path is solved against.
 */
const MID_SCALE = 0.94;
const FRONT_SCALE = 1.15;

type V2 = [number, number];

type Geometry = {
  /** Canvas size in CSS pixels, which is the shader's coordinate space. */
  w: number;
  h: number;
  center: V2;
  size: number;
  /** In-plane turn of the glass (radians) that puts a corner where the path needs it. */
  roll: number;
  source: V2;
  entry: V2;
  exit: V2;
  target: V2;
  /** Unit vector the (middle of the) spectrum leaves along, and its normal toward violet. */
  fanDir: V2;
  fanNrm: V2;
  reach: number;
  nearHalf: number;
  spread: number;
  halo: V2;
};

const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];
const polar = (angle: number): V2 => [Math.cos(angle), Math.sin(angle)];

/** Where the line p + t·d crosses segment a–b, as t (or null if it misses). */
function cross(p: V2, d: V2, a: V2, b: V2) {
  const e = sub(b, a);
  const den = d[0] * e[1] - d[1] * e[0];
  if (Math.abs(den) < 1e-9) return null;
  const q = sub(a, p);
  const t = (q[0] * e[1] - q[1] * e[0]) / den;
  const s = (q[0] * d[1] - q[1] * d[0]) / den;
  return s >= -1e-6 && s <= 1 + 1e-6 ? t : null;
}

/**
 * Solves the light path for a prism at `center` whose spectrum must land on
 * `target`. At minimum deviation the ray inside the glass runs parallel to
 * the base and the two outside rays are mirror images, so the prism's turn
 * follows from the exit direction; the exit point then moves with the turn,
 * so a few rounds settle it.
 */
function solve(center: V2, radius: number, target: V2) {
  let exit = center;
  let out = 0;
  let apex = 0;
  let entry = center;
  let dIn: V2 = [0, 1];
  for (let k = 0; k < 6; k++) {
    out = Math.atan2(target[1] - exit[1], target[0] - exit[0]);
    // Light is turned toward the base; screen angles grow clockwise, so the
    // way in is the way out, turned back by the deviation.
    const inAngle = out - D_MID;
    const mid = inAngle + D_MID / 2;
    apex = mid - Math.PI / 2;
    const tri = [0, 1, 2].map((i) => add(center, mul(polar(apex + (i * 2 * Math.PI) / 3), radius)));
    dIn = polar(inAngle);
    const dMid = polar(mid);
    // The ray inside passes through the middle of the prism, parallel to the base.
    const ts = [cross(center, dMid, tri[0], tri[1]), cross(center, dMid, tri[0], tri[2])].filter(
      (t): t is number => t !== null,
    );
    entry = add(center, mul(dMid, Math.min(...ts)));
    exit = add(center, mul(dMid, Math.max(...ts)));
  }
  return { apex, entry, exit, dIn, out };
}

/**
 * Layout position of an element relative to an ancestor, walking the
 * offsetParent chain. Reveal wrappers may be mid-transform, so offsets (which
 * ignore transforms) are used rather than client rects.
 */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== root) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    const next: Element | null = cur.offsetParent;
    cur = next instanceof HTMLElement ? next : null;
  }
  return { x, y };
}

/** Ink box of an element's text, which is narrower than its layout box. */
function inkRight(el: Element | null) {
  if (!el) return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  const rect = range.getBoundingClientRect();
  return rect.width ? rect.right : 0;
}

function measure(host: HTMLDivElement): Geometry | null {
  const panel = host.offsetParent;
  if (!(panel instanceof HTMLElement)) return null;
  const w = host.offsetWidth;
  const h = host.offsetHeight;
  const button = panel.querySelector<HTMLElement>("[data-prism-target]");
  const level = panel.querySelector<HTMLElement>("[data-prism-level]");
  if (!w || !h || !button || !level) return null;

  // The canvas overhangs the panel, so panel coordinates shift by the overhang.
  const dx = -host.offsetLeft;
  const dy = -host.offsetTop;

  const btn = offsetWithin(button, panel);
  const target: V2 = [btn.x + button.offsetWidth / 2 + dx, btn.y + button.offsetHeight / 2 + dy];

  const panelBox = panel.getBoundingClientRect();
  const levelBox = level.getBoundingClientRect();
  // Level with the middle of the word (headings only fade, never move, so
  // the client rect is the settled position).
  const levelY = levelBox.top + levelBox.height / 2 - panelBox.top + dy;
  const levelRight = inkRight(level) - panelBox.left + dx;

  const contentRight = Math.max(
    inkRight(panel.querySelector("h2")) - panelBox.left,
    inkRight(panel.querySelector("p")) - panelBox.left,
    btn.x + button.offsetWidth,
  );

  // The glass at its original size, in the clear space right of the copy on
  // larger screens and near the right edge on phones, always clear of the
  // word it sits level with and inside the screen.
  const narrow = w < 768;
  let size = narrow ? Math.min(72, Math.max(56, w * 0.17)) : Math.min(126, Math.max(78, w * 0.075));
  const room = w - 8 - (levelRight + 16);
  size = Math.max(36, Math.min(size, room / (2 * FRONT_SCALE)));
  const reachR = size * FRONT_SCALE;
  let px = narrow ? w - 8 - reachR : Math.max(w * 0.76, contentRight + dx + size + 40);
  px = Math.min(px, w - 8 - reachR);
  px = Math.max(px, levelRight + 16 + reachR);
  const center: V2 = [px, levelY];

  const { apex, entry, exit, dIn, out } = solve(center, size * MID_SCALE, target);

  // Far enough back along the incoming ray to start beyond the canvas.
  const source = sub(entry, mul(dIn, (w + h) * 1.2));
  const fanDir = polar(out);
  // Violet is deviated most: it lies toward larger screen angles.
  const fanNrm: V2 = [-fanDir[1], fanDir[0]];
  const dist = Math.hypot(target[0] - exit[0], target[1] - exit[1]);

  return {
    w,
    h,
    center,
    size,
    // The glass's own corner points straight down (screen y); turning it by
    // 90° minus the apex angle puts that corner where the path needs it.
    roll: Math.PI / 2 - apex,
    source,
    entry,
    exit,
    target,
    fanDir,
    fanNrm,
    reach: dist * 1.08,
    nearHalf: size * 0.1,
    spread: Math.tan(SPREAD / 2),
    halo: [button.offsetWidth * 0.85, button.offsetHeight * 1.5],
  };
}

const vertex = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform vec2  iResolution;
  uniform float uInvDpr;
  uniform float iTime;
  uniform float uProgress;
  uniform vec2  uPrism;
  uniform float uPrismSize;
  uniform float uRoll;
  uniform vec3  uToBeam;
  uniform vec2  uSource;
  uniform vec2  uEntry;
  uniform vec2  uExit;
  uniform vec2  uTarget;
  uniform vec2  uFanDir;
  uniform vec2  uFanNrm;
  uniform float uReach;
  uniform float uNearHalf;
  uniform float uSpread;
  uniform vec2  uHalo;

  /* Half-extents of the solid: an equilateral triangle, extruded toward us. */
  const float TRI = 0.75;
  const float DEPTH = 0.72;

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
    vec3 hh = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + hh * hh);
    vec3 g;
    g.x = a0.x * x0.x + hh.x * x0.y;
    g.yz = a0.yz * x12.xz + hh.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  /*
   * Not a hue wheel: the colours a real caustic throws, keyed by hand. Deep
   * blue on the cool edge, through cyan and a pale warm core, into amber,
   * orange and a deep red that falls away into the dark. No magenta, which is
   * what makes a cycled palette read as neon rather than as light.
   */
  vec3 caustic(float x) {
    vec3 c = mix(vec3(0.04, 0.08, 0.38), vec3(0.10, 0.42, 0.92), smoothstep(0.00, 0.26, x));
    c = mix(c, vec3(0.40, 0.84, 0.97), smoothstep(0.24, 0.40, x));
    c = mix(c, vec3(0.45, 0.96, 0.55), smoothstep(0.36, 0.46, x));
    c = mix(c, vec3(1.00, 0.97, 0.78), smoothstep(0.45, 0.52, x));
    c = mix(c, vec3(1.00, 0.74, 0.24), smoothstep(0.51, 0.64, x));
    c = mix(c, vec3(1.00, 0.38, 0.06), smoothstep(0.62, 0.80, x));
    c = mix(c, vec3(0.85, 0.09, 0.02), smoothstep(0.78, 1.00, x));
    return c;
  }

  float unit(float v, float a, float b) {
    return clamp((v - a) / (b - a), 0.0, 1.0);
  }

  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float t = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * t);
  }

  mat3 tumble(float t) {
    // A slow turn in space, enough to read as a solid, while its in-plane
    // turn holds the corner the light path needs.
    float yaw = sin(t * 0.13) * 0.3;
    float pitch = sin(t * 0.087 + 1.1) * 0.12;
    float roll = uRoll + sin(t * 0.05) * 0.02;
    float cy = cos(yaw), sy = sin(yaw);
    float cx = cos(pitch), sx = sin(pitch);
    float cz = cos(roll), sz = sin(roll);
    mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
    mat3 rz = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
    return rz * rx * ry;
  }

  /*
   * The solid is convex, so the ray span through it is the intersection of five
   * half-spaces. Solving it exactly beats ray marching here: the silhouette
   * never breaks into stray dots where a ray grazes a face, the thickness of
   * glass behind the hit comes out of the same calculation, and it is cheaper.
   */
  bool prismSpan(vec3 lo, vec3 ld, out float tIn, out float tOut, out vec3 nIn) {
    float tmin = -1e9;
    float tmax = 1e9;
    vec3 nmin = vec3(0.0, 0.0, 1.0);
    bool ok = true;
    for (int i = 0; i < 5; i++) {
      vec3 n;
      float d;
      if (i == 0) { n = vec3(0.866025, 0.5, 0.0); d = TRI; }
      else if (i == 1) { n = vec3(-0.866025, 0.5, 0.0); d = TRI; }
      else if (i == 2) { n = vec3(0.0, -1.0, 0.0); d = TRI; }
      else if (i == 3) { n = vec3(0.0, 0.0, 1.0); d = DEPTH; }
      else { n = vec3(0.0, 0.0, -1.0); d = DEPTH; }
      float dn = dot(ld, n);
      float num = d - dot(lo, n);
      if (abs(dn) < 1e-5) {
        if (num < 0.0) ok = false;
      } else {
        float tt = num / dn;
        if (dn < 0.0) {
          if (tt > tmin) { tmin = tt; nmin = n; }
        } else {
          tmax = min(tmax, tt);
        }
      }
    }
    tIn = tmin;
    tOut = tmax;
    nIn = nmin;
    return ok && tmin < tmax && tmax > 0.0;
  }

  /* One ray of glass, returned premultiplied so samples can be averaged. */
  vec4 glassSample(vec2 uvp, mat3 rot, float lit, float appear) {
    vec2 q = (uvp - uPrism) / uPrismSize;
    vec3 ro = vec3(0.0, 0.0, 3.2);
    vec3 rd = normalize(vec3(q * 0.95, -1.9));
    float tIn, tOut;
    vec3 nl;
    if (!prismSpan(rot * ro, rot * rd, tIn, tOut, nl)) return vec4(0.0);

    // Local normals come back out of the rotation by its transpose.
    vec3 n = normalize(nl * rot);
    float thick = clamp((tOut - tIn) / 1.9, 0.0, 1.0);
    vec3 hp = ro + rd * max(tIn, 0.0);

    float facing = clamp(dot(n, -rd), 0.0, 1.0);
    float fres = pow(1.0 - facing, 2.4);
    // A side face seen almost edge-on is only a sliver. Lit, it would read as
    // a hard white line, so its highlight and rim fade away there.
    float open = smoothstep(0.08, 0.45, facing);

    // Split the transmitted ray three ways for a cheap chromatic spread, read
    // off the same caustic ramp as the light it is throwing.
    vec3 axisW = vec3(0.45, 0.68, 0.2);
    vec3 rr = refract(rd, n, 0.64);
    vec3 rg = refract(rd, n, 0.70);
    vec3 rb = refract(rd, n, 0.76);
    vec3 disp = vec3(
      caustic(fract(0.5 + dot(rr, axisW) * 0.8)).r,
      caustic(fract(0.5 + dot(rg, axisW) * 0.8)).g,
      caustic(fract(0.5 + dot(rb, axisW) * 0.8)).b
    );

    // Faint bands inside the body, the way real glass carries its own light.
    float bands = 0.5 + 0.5 * sin(dot(hp, vec3(3.2, 2.4, 1.6)) * 3.4 + iTime * 0.5);
    float spec = pow(clamp(dot(n, uToBeam), 0.0, 1.0), 26.0) * open;

    vec3 glass = disp * (0.5 + 0.7 * thick + 0.25 * bands);
    glass += vec3(1.0, 0.97, 0.92) * pow(fres, 1.3) * 0.85 * mix(0.3, 1.0, open);
    glass += vec3(1.0) * spec * (0.35 + 0.55 * lit);

    // Where the shaft actually enters, the body lights from within.
    float strike = exp(-length(uvp - uEntry) / (uPrismSize * 0.55)) * lit;
    glass += vec3(1.0, 0.95, 0.85) * strike * 0.8;

    // See-through in the thin places, with the edges carrying the light.
    float a = clamp(
      0.03 + thick * 0.1 + fres * 0.42 * mix(0.35, 1.0, open) + bands * 0.025 + spec * 0.4 + strike * 0.25,
      0.0, 1.0
    ) * appear;

    return vec4(glass * a, a);
  }

  void main() {
    // Work in CSS pixels with a top-left origin, matching the measured layout.
    vec2 uv = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y) * uInvDpr;
    float t = iTime;
    float p = uProgress;

    // Stages. The beam arrives first, the prism lights, the spectrum travels
    // out, and the glow settles on the button as the button itself appears.
    float beamIn  = unit(p, 0.05, 0.30);
    float prismIn = unit(p, 0.14, 0.34);
    float lit     = unit(p, 0.28, 0.46);
    float fanIn   = unit(p, 0.30, 0.48);
    float front   = unit(p, 0.32, 0.78);
    float haloIn  = unit(p, 0.64, 0.92);

    // Everything below accumulates premultiplied, so colour and opacity stay
    // independent: the core can run hot while the whole thing stays sheer.
    vec4 acc = vec4(0.0);

    /* ---- the spectrum, fanning out from the exit face ---- */
    vec2 rel = uv - uExit;
    float along = dot(rel, uFanDir);
    float across = dot(rel, uFanNrm);
    float un = along / uReach;
    // It widens steadily with distance: the colours part as they travel.
    float halfW = uNearHalf + max(along, 0.0) * uSpread;
    float vn = across / max(halfW, 1.0);

    // Drift and a gentle bow, so it reads as light thrown onto a surface
    // rather than a band ruled between two points.
    float n1 = snoise(vec2(un * 2.2 - t * 0.08, vn * 1.1 + t * 0.045));
    float n2 = snoise(vec2(un * 4.8 + t * 0.055, vn * 2.2 - t * 0.03));
    float vv = vn + (n1 * 0.12 + n2 * 0.05) * smoothstep(0.03, 0.65, un);

    // Soft the whole way across, with no flat top: a hot core falling away into
    // the black, the warm half reaching further than the cool half.
    float warm = 1.0 - step(0.0, vv);
    float body = exp(-vv * vv * mix(1.6, 1.0, warm));
    float core = exp(-vv * vv * 12.0);

    float mouth = smoothstep(-0.01, 0.04, un);
    float tail = smoothstep(1.14, 0.74, un);
    float wave = smoothstep(front + 0.02, front - 0.24, un);
    // Brightest as it leaves the glass, gentler by the time it crosses the
    // copy, which is both how light behaves and what keeps the text readable.
    float travel = mix(1.0, 0.5, smoothstep(0.06, 0.95, un));
    float gate = mouth * tail * wave * fanIn * travel;

    float fanA = (body * 0.38 + core * 0.24) * gate;
    // Violet on the most bent side (vn > 0), red on the least.
    vec3 fanCol = caustic(clamp(0.5 - vv * mix(0.3, 0.4, step(0.0, vv)), 0.0, 1.0));
    // Push the chroma before the core whitens it, so the colour stays rich
    // at low opacity rather than drifting grey; hot, and still undispersed,
    // right at the exit face.
    fanCol = mix(vec3(dot(fanCol, vec3(0.299, 0.587, 0.114))), fanCol, 1.3);
    fanCol = mix(fanCol, vec3(1.45, 1.4, 1.3), core * 0.25 + exp(-max(un, 0.0) * 16.0) * 0.55);

    acc.rgb += fanCol * fanA;
    acc.a += fanA * 0.95;

    // A wide, very soft wash underneath so the colour sits in the air.
    float washA = exp(-vv * vv * 0.32) * gate * 0.075;
    acc.rgb += fanCol * 0.8 * washA;
    acc.a += washA;

    /* ---- the shaft of light ---- */
    vec2 beamAxis = uEntry - uSource;
    float axisLen = max(length(beamAxis), 1.0);
    vec2 beamEnd = mix(uSource, uEntry, beamIn);
    float bd = segDist(uv, uSource, beamEnd);
    float axis = clamp(dot(uv - uSource, beamAxis / axisLen) / axisLen, 0.0, 1.0);
    float dust = 0.82 + 0.18 * snoise(vec2(axis * 6.0 - t * 0.45, bd * 0.03));
    // A hot core inside a wide, soft shaft that gathers toward the prism.
    float bCore = exp(-bd * bd / 16.0);
    float shaft = exp(-bd / (uPrismSize * 0.3));
    float wide = exp(-bd / (uPrismSize * 0.95));
    float beamA = clamp((bCore * 0.5 + shaft * 0.14 + wide * 0.05) * mix(0.06, 1.0, axis) * dust * beamIn, 0.0, 1.0);
    vec3 beamCol = vec3(1.4, 1.36, 1.28);

    acc.rgb += beamCol * beamA;
    acc.a += beamA;

    /* ---- the glass prism ---- */
    vec2 relP = uv - uPrism;
    float near = length(relP) / uPrismSize;
    if (near < 2.2 && prismIn > 0.001) {
      mat3 rot = tumble(t);
      // Four rays inside the pixel: the silhouette is a hard edge, and the
      // canvas is upscaled, so it needs the extra samples to stay clean.
      float o = uInvDpr * 0.25;
      vec4 g = glassSample(uv + vec2(-o, -o), rot, lit, prismIn);
      g += glassSample(uv + vec2(o, -o), rot, lit, prismIn);
      g += glassSample(uv + vec2(-o, o), rot, lit, prismIn);
      g += glassSample(uv + vec2(o, o), rot, lit, prismIn);
      g *= 0.25;

      acc.rgb = acc.rgb * (1.0 - g.a) + g.rgb;
      acc.a = acc.a * (1.0 - g.a) + g.a;

      // A soft bloom around the glass once the beam is striking it.
      float bloom = exp(-near * near * 1.4) * lit * 0.1;
      acc.rgb += vec3(1.0, 0.94, 0.86) * bloom;
      acc.a += bloom;
    }

    /* ---- the light inside the glass, bent toward the base ---- */
    float id = segDist(uv, uEntry, uExit);
    // Kept soft, so it reads as light glowing through the glass, not a ruled line.
    float inner = (exp(-id * id / 36.0) * 0.2 + exp(-id / (uPrismSize * 0.14)) * 0.1) * lit;
    acc.rgb += vec3(1.2, 1.16, 1.1) * inner;
    acc.a += inner;

    /* ---- where the spectrum lands ---- */
    vec2 hv = (uv - uTarget) / uHalo;
    float hd = dot(hv, hv);
    float haloA = exp(-hd * 1.5) * haloIn * 0.16;
    vec3 haloCol = vec3(1.0, 0.74, 0.34);
    acc.rgb += haloCol * haloA;
    acc.a += haloA;

    acc.a = clamp(acc.a, 0.0, 1.0);

    // Already premultiplied, so it goes out as it is.
    gl_FragColor = vec4(max(acc.rgb, vec3(0.0)), acc.a);
  }
`;

/** A live progress value (0 to 1) the render loop reads each frame. */
export type Progress = { value: number };

export function PrismRefraction({ progress }: { progress: Progress }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program | null>(null);
  const progressRef = useRef(progress);
  const [geo, setGeo] = useState<Geometry | null>(null);

  // The render loop reads the latest value each frame.
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const read = () =>
      setGeo((prev) => {
        const next = measure(el);
        if (!next) return null;
        if (
          prev &&
          prev.w === next.w &&
          prev.h === next.h &&
          Math.abs(prev.center[0] - next.center[0]) < 0.5 &&
          Math.abs(prev.center[1] - next.center[1]) < 0.5 &&
          Math.abs(prev.target[1] - next.target[1]) < 0.5
        ) {
          return prev;
        }
        return next;
      });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const panel = el.offsetParent;
    if (panel instanceof HTMLElement) ro.observe(panel);
    window.addEventListener("resize", read);
    document.fonts?.ready.then(read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !geo) return;

    const dpr = Math.min(1, window.devicePixelRatio || 1) * 0.65;
    const renderer = new Renderer({
      dpr,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    Object.assign(gl.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    host.appendChild(gl.canvas);

    // Toward the incoming light, for the glint on the faces it strikes.
    const back = sub(geo.source, geo.entry);
    const bl = Math.hypot(back[0], back[1]) || 1;
    const toBeam = [back[0] / bl, back[1] / bl, 0.62];
    const tl = Math.hypot(toBeam[0], toBeam[1], toBeam[2]);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: [1, 1] },
        uInvDpr: { value: 1 / dpr },
        iTime: { value: 0 },
        uProgress: { value: progressRef.current.value },
        uPrism: { value: geo.center },
        uPrismSize: { value: geo.size },
        uRoll: { value: geo.roll },
        uToBeam: { value: toBeam.map((v) => v / tl) },
        uSource: { value: geo.source },
        uEntry: { value: geo.entry },
        uExit: { value: geo.exit },
        uTarget: { value: geo.target },
        uFanDir: { value: geo.fanDir },
        uFanNrm: { value: geo.fanNrm },
        uReach: { value: geo.reach },
        uNearHalf: { value: geo.nearHalf },
        uSpread: { value: geo.spread },
        uHalo: { value: geo.halo },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    programRef.current = program;

    const resize = () => {
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
      program.uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let raf = 0;
    let running = false;
    let last = 0;
    const t0 = performance.now();
    const FRAME_MS = 1000 / 40;
    // If the section is reached without scrolling through it (a jump to the
    // bottom, say), the sequence plays itself over a few seconds instead.
    let playFrom: number | null = null;
    const PLAY_MS = 2800;
    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      if (time - last < FRAME_MS) return;
      last = time;
      program.uniforms.iTime.value = (time - t0) * 0.001;
      let p = progressRef.current.value;
      if (playFrom !== null) {
        const u = Math.min(1, (time - playFrom) / PLAY_MS);
        p = 1 - Math.pow(1 - u, 2.2);
      }
      program.uniforms.uProgress.value = p;
      renderer.render({ scene: mesh });
    };
    let seen = false;
    const start = () => {
      if (running) return;
      running = true;
      if (!seen) {
        seen = true;
        if (progressRef.current.value >= 0.98) playFrom = performance.now();
      }
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only run while the section is on screen.
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
      else stop();
    });
    io.observe(host);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      if (gl.canvas.parentElement === host) host.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      programRef.current = null;
    };
  }, [geo]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -z-10"
      style={{
        top: `-${OVER_TOP}`,
        bottom: `-${OVER_BOTTOM}`,
        // Feathered at the top and bottom, so the canvas never ends in a line.
        maskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 62%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 62%, transparent 100%)",
      }}
    />
  );
}
