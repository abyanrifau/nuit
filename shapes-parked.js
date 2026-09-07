/* =====================================================================
   Nuit Works — parked shapes
   NOT LOADED BY ANY PAGE. Kept for reuse.

   These generators were part of the particle field's shape table
   alongside the galaxy and the wordmark. They were retired because the
   site now shows only two forms — the galaxy in the hero and the NUIT
   wordmark in the footer — with dispersed haze in between, and morphing
   between those two walked visibly through these on the way.

   To put one back:
     1. Paste the function into app.js beside genGalaxy.
     2. Add it to SHAPES in the order you want it reached; the array
        index is what a section's data-shape attribute refers to.
     3. Widen the vertex shader to match: one `attribute vec3 aPn` per
        shape, the clamp in `float p = clamp(uProgress, 0.0, N-1)`, the
        segment picker below it, the attribute list passed to
        createProgram, and the two bindAttrib/disable loops in render().
     4. WORDMARK_I is derived from SHAPES, so it follows automatically.

   They expect the same helpers as the live generators: TAU, rnd and
   finish() from app.js.
   ===================================================================== */

  function genSphere(N) {
    const pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y0 = 1 - 2 * (i + 0.5) / N;
      const rr = Math.sqrt(1 - y0 * y0);
      const phi = i * ga;
      const rad = rnd() < 0.72 ? 1.08 + 0.1 * rnd() : 1.12 * Math.sqrt(rnd());
      pts.push([Math.cos(phi) * rr * rad, y0 * rad, Math.sin(phi) * rr * rad, 0]);
    }
    return finish(pts);
  }

  function genRing(N) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const k = rnd();
      if (k < 0.14) {
        const r = Math.sqrt(rnd()) * 1.25, th = rnd() * TAU;
        pts.push([r * Math.cos(th), (rnd() - 0.5) * 0.04, r * Math.sin(th), 0]);
      } else if (k < 0.24) {
        const r = 0.28 * Math.cbrt(rnd()), th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
        pts.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th), 0]);
      } else {
        const R = 1.48, tube = 0.035 + 0.1 * Math.pow(rnd(), 2.2);
        const th = rnd() * TAU, ph = rnd() * TAU;
        const rr = R + tube * Math.cos(ph);
        pts.push([rr * Math.cos(th), tube * Math.sin(ph), rr * Math.sin(th), 0]);
      }
    }
    return finish(pts);
  }
