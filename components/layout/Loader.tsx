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
 * It stays until the site has really finished loading: the window's load
 * event, every font, the background light and the hero prism fully drawn
 * (LightField and HeroPrism announce those). The count never reaches 100
 * before then, and never in under about two seconds: the cover stays at
 * least 2.5s, holds 0.4s at 100 and lifts over 0.8s. If something never
 * arrives, it finishes anyway by about eight seconds. Any click or key
 * skips it.
 *
 * It never gets in the way of the page itself: the content is server-rendered
 * underneath the whole time, the cover is aria-hidden, and it only shows when
 * the script in <head> has chosen to play it, so without JavaScript there is
 * no cover at all. The sequence is run by a small inline script rather than
 * the app's bundle, so a slow bundle cannot hold it up, and the script in
 * <head> lifts the cover after ten seconds whatever happens. With reduced
 * motion: the wordmark and a still line until the site is ready, then a
 * plain fade.
 */

const WORDMARK = "Nuit Works.";

const MARKUP = `<div id="loader" class="loader"><div class="loader-inner px-site"><div class="loader-row"><p class="loader-mark">${WORDMARK.split(
  "",
)
  .map((ch, i) => `<span class="loader-letter" style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`)
  .join(
    "",
  )}</p><p class="loader-count"><span data-count>0</span>%</p></div><div class="loader-line"><span class="loader-fill"></span><span class="loader-tip"></span></div></div></div>`;

/** Runs in <head> before first paint: play on the first visit, skip after that. */
export const LOADER_HEAD_SCRIPT = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("nw-loader")){d.dataset.loader="skip";return}sessionStorage.setItem("nw-loader","1");d.dataset.loader="play";if(matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.loaderStill="";setTimeout(function(){if(d.dataset.loader==="play"){d.dataset.loader="done";d.dataset.loaderBail=""}},10000)}catch(e){}})();`;

/* Runs as soon as the markup above it is parsed, before the app loads.
   Times are in ms from when it starts. */
const LOADER_SCRIPT = `(function(){
var d=document.documentElement,el=document.getElementById("loader");
if(!el||d.dataset.loader!=="play")return;
var now=function(){return performance.now()},t0=now(),exiting=false;
var MIN_FULL=2100,HOLD=400,SAFETY=7100;
function lift(){el.dataset.stage="out";setTimeout(function(){d.dataset.loader="done"},300)}
function stop(){removeEventListener("pointerdown",skip,true);removeEventListener("keydown",skip,true)}
function skip(){if(exiting)return;exiting=true;stop();el.dataset.stage="skip";d.dataset.loader="done"}
addEventListener("pointerdown",skip,true);addEventListener("keydown",skip,true);
var loaded=document.readyState==="complete",hero=!!d.dataset.heroReady,light=!!d.dataset.lightReady;
addEventListener("load",function(){loaded=true});
addEventListener("nw:hero-ready",function(){hero=true});
addEventListener("nw:light-ready",function(){light=true});
function noHero(){if(!document.getElementById("hero-wordmark"))hero=true}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",noHero);else noHero();
function ready(){return loaded&&hero&&light&&(!document.fonts||document.fonts.status==="loaded")}
if("loaderStill" in d.dataset){el.dataset.stage="in";
(function wait(){if(exiting)return;var t=now()-t0;
if((ready()&&t>=MIN_FULL+HOLD)||t>=SAFETY+HOLD){exiting=true;stop();lift();return}
setTimeout(wait,100)})();return}
var count=el.querySelector("[data-count]"),mark=el.querySelector(".loader-mark");
var fontLoad;try{fontLoad=document.fonts.load("700 1em "+getComputedStyle(mark).fontFamily)}catch(e){fontLoad=Promise.resolve()}
var started=false,tCount=0;
function start(){if(started)return;started=true;el.dataset.stage="in";tCount=now()+150;requestAnimationFrame(tick)}
Promise.resolve(fontLoad).then(start,start);setTimeout(start,350);
var out=function(k){return 1-Math.pow(1-k,3)};
var v=0,shown=-1,tFrom=0,vFrom=0,tEnd=0;
function tick(){if(exiting)return;var t=now();
if(t<tCount){requestAnimationFrame(tick);return}
var e=t-tCount;
if(!tEnd&&(ready()||t-t0>=SAFETY-600)){tFrom=e;vFrom=v;tEnd=Math.max(e+600,MIN_FULL-(tCount-t0))}
if(!tEnd)v=90*(1-Math.exp(-e/1100));
else v=vFrom+(100-vFrom)*out(Math.min(1,(e-tFrom)/(tEnd-tFrom)));
el.style.setProperty("--p",(v/100).toFixed(4));
var n=Math.round(v);if(n!==shown){shown=n;count.textContent=n}
if(tEnd&&e>=tEnd){exiting=true;stop();el.dataset.stage="full";setTimeout(lift,HOLD);return}
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
