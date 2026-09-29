/*
 * The loading screen, on the first visit per browser session only.
 *
 * Strictly black and white: "Nuit Works." on the left and a thin line with
 * a counter above it on the right, as on the previous site, larger and a
 * little more animated. The wordmark sharpens in letter by letter, the line
 * draws across as the count rises, with a small soft white highlight at its
 * tip; at 100 it holds for a moment, then the count and line fade, the
 * wordmark blurs away and the cover lifts to the hero (globals.css).
 *
 * The whole sequence always plays, in order, at its own pace. The count
 * runs on a fixed timeline (about two seconds, quick at first and slowing
 * toward the end) and the cover only lifts once that timeline has reached
 * 100 AND the site has finished loading: the window's load event, every
 * font, the background light and the hero prism fully drawn (LightField and
 * HeroPrism announce those). If the site is ready early, the count still
 * finishes at its normal pace. If it is slower, the count eases off near
 * the end and waits, then glides on to 100 once everything is in; it never
 * jumps. The cover stays at least 2.5s, holds 0.4s at 100 and lifts over
 * 0.8s. If something never arrives, it treats the site as ready at eight
 * seconds and still finishes the same way. Nothing the visitor does ends
 * it early, and the page cannot scroll while it is up.
 *
 * It only counts as seen once it has fully finished, so reloading halfway
 * through plays it again.
 *
 * It never gets in the way of the page itself: the content is server-rendered
 * underneath the whole time, the cover is aria-hidden, and it only shows when
 * the script in <head> has chosen to play it, so without JavaScript there is
 * no cover at all. The sequence is run by a small inline script rather than
 * the app's bundle, so a slow bundle cannot hold it up, and the script in
 * <head> lifts the cover after twelve seconds should that inline script ever
 * fail. With reduced motion: the wordmark and a still line until the site
 * is ready, then a plain fade.
 */

const WORDMARK = "Nuit Works.";

const MARKUP = `<div id="loader" class="loader grain-cover"><div class="loader-inner px-site"><div class="loader-row"><p class="loader-mark">${WORDMARK.split(
  "",
)
  .map((ch, i) => `<span class="loader-letter" style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`)
  .join(
    "",
  )}</p><p class="loader-count"><span data-count>0</span>%</p></div><div class="loader-line"><span class="loader-fill"></span><span class="loader-tip"></span></div></div></div>`;

/**
 * Runs in <head> before first paint: play on the first visit, skip after
 * that, and hold the page still while it plays. The last resort, after
 * twelve seconds, only acts if the sequence below never ran.
 */
export const LOADER_HEAD_SCRIPT = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("nw-loader")){d.dataset.loader="skip";return}d.dataset.loader="play";d.dataset.scrollLock="";if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.loaderStill="";setTimeout(function(){if(d.dataset.loader==="play"){d.dataset.loader="done";d.dataset.loaderBail="";delete d.dataset.scrollLock;try{sessionStorage.setItem("nw-loader","1")}catch(e){}}},12000)}catch(e){}})();`;

/* Runs as soon as the markup above it is parsed, before the app loads.
   Times are in ms from when it starts. */
const LOADER_SCRIPT = `(function(){
var d=document.documentElement,el=document.getElementById("loader");
if(!el||d.dataset.loader!=="play")return;
var now=function(){return performance.now()},t0=now();
var DURATION=1950,MIN_SHOWN=2500,HOLD=400,EXIT=800,SAFETY=8000;
var loaded=document.readyState==="complete",hero=!!d.dataset.heroReady,light=!!d.dataset.lightReady;
addEventListener("load",function(){loaded=true});
addEventListener("nw:hero-ready",function(){hero=true});
addEventListener("nw:light-ready",function(){light=true});
function noHero(){if(!document.getElementById("hero-wordmark"))hero=true}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",noHero);else noHero();
function ready(){return (loaded&&hero&&light&&(!document.fonts||document.fonts.status==="loaded"))||now()-t0>=SAFETY}
function finish(){
el.dataset.stage="out";
setTimeout(function(){d.dataset.loader="done"},300);
setTimeout(function(){delete d.dataset.scrollLock;try{sessionStorage.setItem("nw-loader","1")}catch(e){}},EXIT)}
/* The hold starts once 100 is actually on screen (two frames later), so a
   busy main thread can never eat into it. */
function lift(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(finish,Math.max(HOLD,MIN_SHOWN-(now()-t0)))})})}
if("loaderStill" in d.dataset){el.dataset.stage="in";
(function wait(){if(ready()&&now()-t0>=MIN_SHOWN)finish();else setTimeout(wait,100)})();return}
var count=el.querySelector("[data-count]"),mark=el.querySelector(".loader-mark");
var fontLoad;try{fontLoad=document.fonts.load("700 1em "+getComputedStyle(mark).fontFamily)}catch(e){fontLoad=Promise.resolve()}
var started=false,tCount=0,last=0;
function start(){if(started)return;started=true;el.dataset.stage="in";tCount=now()+150;requestAnimationFrame(tick)}
Promise.resolve(fontLoad).then(start,start);setTimeout(start,350);
/* The normal pace: quick at first, slowing toward 100. */
var pace=function(e){var k=Math.min(1,Math.max(0,e/DURATION));return 100*(1-Math.pow(1-k,2.6))};
/* While the site is still loading, a ceiling that eases from 88 toward 99. */
var CEIL=88,eCeil=-1,eReady=-1,vReady=0,finishing=false;
var v=0,shown=-1;
function target(e){
var tl=pace(e);
if(eReady<0&&ready()){eReady=e;vReady=v;finishing=tl>v+0.5}
if(eReady<0){if(tl<CEIL)return tl;if(eCeil<0)eCeil=e;return Math.min(tl,CEIL+11*(1-Math.exp(-(e-eCeil)/2200)))}
if(!finishing)return tl;
var k=Math.min(1,(e-eReady)/700);return vReady+(100-vReady)*(1-Math.pow(1-k,3))}
function tick(t){if(t<tCount){requestAnimationFrame(tick);return}
var e=t-tCount,dt=last?t-last:16;last=t;
var goal=target(e);
/* Follow the goal smoothly, never more than 3 per frame: after a stalled
   frame the count carries on and catches up rather than skipping numbers. */
v+=Math.min((goal-v)*(1-Math.exp(-dt/70)),3);
if(goal>=100&&v>99.6)v=100;
el.style.setProperty("--p",(v/100).toFixed(4));
var n=Math.floor(v);if(n!==shown){shown=n;count.textContent=n}
if(v>=100){el.dataset.stage="full";lift();return}
requestAnimationFrame(tick)}
})();`;

export function Loader() {
  return (
    <>
      {/* The script rewrites parts of this markup as it runs, so React leaves it alone. */}
      <div aria-hidden="true" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MARKUP }} />
      <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
    </>
  );
}
