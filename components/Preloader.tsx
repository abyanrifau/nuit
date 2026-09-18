/*
 * Intro overlay. Pure CSS and server-rendered, so it costs the main thread
 * nothing and never waits on hydration. It plays once per session for about a
 * second, then fades; the hero is already painted underneath the whole time.
 * A tiny script in the document head marks repeat views so it is skipped.
 */

const WORDMARK = "Nuit Works.";

export function Preloader() {
  return (
    <div
      data-preloader
      aria-hidden="true"
      className="intro gutter fixed inset-0 z-[70] flex flex-col justify-center bg-white text-black"
    >
      <div className="flex items-end justify-between">
        {/* Wordmark: letters rise in one by one */}
        <p className="flex overflow-hidden font-grotesk text-xl leading-none tracking-[-0.02em] md:text-2xl">
          {WORDMARK.split("").map((ch, i) => (
            <span
              key={i}
              className="intro-letter inline-block"
              style={{ animationDelay: `${0.04 + i * 0.022}s` }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
        <p className="intro-count font-neue text-[13px] leading-none tabular-nums" />
      </div>

      {/* Hairline drawing across the page */}
      <div className="mt-5 h-px w-full bg-white">
        <div className="intro-line h-full w-full origin-left bg-black" />
      </div>
    </div>
  );
}

/** Runs before first paint: skip the intro on repeat views within a session. */
export const INTRO_SCRIPT =
  'try{if(sessionStorage.getItem("nuit-intro")){document.documentElement.dataset.intro="done"}else{sessionStorage.setItem("nuit-intro","1")}}catch(e){}';
