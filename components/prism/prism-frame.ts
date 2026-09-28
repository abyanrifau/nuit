/*
 * Where the hero prism sits and how big it is, shared by the live shader
 * and its still frame (kept separate from Prism.tsx so the still frame can
 * be placed without loading the shader).
 *
 * A frame is the prism's origin (in CSS pixels, relative to the hero) and
 * the size of one shader unit in CSS pixels. The canvas reaches REACH units
 * from the origin (trimmed to the page's width and top); only the faint
 * outer glow thins out, inside the shader, before that edge.
 *
 * Both layouts are the previous site's own: its prism filled the hero, one
 * unit was a share of the hero's height (0.1 x its scale), and the origin
 * sat 40px below the middle, pushed 300px right where there was a mouse.
 */

export type PrismFrame = { cx: number; cy: number; unit: number };

/** Units from the origin to the edge of the canvas. */
export const REACH = 3.3;
/** Where the outer glow starts to thin. The prism stays within 2.63 units of
 *  its origin in any orientation (its glow within about 2.65), so it is never
 *  touched. */
export const FADE_FROM = 2.75;

/** A mouse or trackpad: the prism follows the cursor and sits to the right.
 *  Anything else (phones, tablets) gets the big, centred touch layout. Keep
 *  in step with the hero's gap and fade in globals.css. */
export const MOUSE_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * Mouse: the previous site's desktop hero. One unit is 0.36 of the hero's
 * height (scale 3.6) and the origin sits 40px below the middle and 300px
 * right of centre, exactly as now from 1280px up. In narrower windows the
 * push shrinks in proportion, so the prism always sits at the same point
 * to the right of centre (about 73% across) and never moves to the middle.
 */
export function mouseFrame(width: number, height: number): PrismFrame {
  return { cx: width / 2 + 300 * Math.min(1, width / 1280), cy: height / 2 + 40, unit: height * 0.1 * 3.6 };
}

/**
 * Touch: the previous site's phone hero. One unit is 0.24 of the hero's
 * height (scale 2.4), centred, 40px below the middle: a huge, soft prism
 * filling the hero behind the heading, its base more than twice the width
 * of a phone. On a wide, short screen (a tablet held landscape) it never
 * drops below 0.3 of the width, so it stays that big there too.
 */
export function touchFrame(width: number, height: number): PrismFrame {
  return { cx: width / 2, cy: height / 2 + 40, unit: Math.max(height * 0.1 * 2.4, width * 0.3) };
}
