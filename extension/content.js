(() => {
  const AD_SELECTORS = [
    "ytd-display-ad-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-ad-slot-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-banner-promo-renderer",
    "ytd-video-masthead-ad-v3-renderer",
    ".ytp-ad-module",
    ".ytp-ad-overlay-container",
    ".ytp-ad-text",
    "#player-ads",
    "#masthead-ad",
    "#google_companion_ad",
    "[class*='ytd-ad']"
  ];

  const removeAds = () => {
    document.querySelectorAll(AD_SELECTORS.join(",")).forEach((element) => {
      if (element instanceof HTMLElement) element.remove();
    });

    const player = document.querySelector("video.html5-main-video");
    const adShowing = document.querySelector(".ad-showing, .ad-interrupting");
    if (!(player instanceof HTMLVideoElement) || !adShowing) return;

    const skip = document.querySelector(".ytp-ad-skip-button, .ytp-ad-skip-button-modern");
    if (skip instanceof HTMLElement) skip.click();

    if (Number.isFinite(player.duration) && player.duration > 0) {
      player.currentTime = player.duration;
      player.muted = true;
      player.play().catch(() => undefined);
    }
  };

  const observer = new MutationObserver(removeAds);
  const start = () => {
    removeAds();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.documentElement) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
  window.addEventListener("yt-navigate-finish", removeAds);
})();
