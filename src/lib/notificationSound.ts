/**
 * Notification sounds for the CRM.
 *
 * Two distinct cues, deliberately kept apart so a routine notification never
 * gets mistaken for a new order:
 *
 *   notification.mp3    generic `notification_created` (bell badge, enquiries,
 *                       low stock, etc.) — universfield new-notification
 *   order-received.mp3  a new order landed — woo commerce order chime
 *
 * Browsers block audio until the user has interacted with the page, so playback
 * failures are swallowed: a missed chime is better than an unhandled rejection.
 *
 * Audio elements are pooled per cue rather than created per play. Rebuilding an
 * `Audio` on every event causes a network re-fetch in some browsers, which under
 * rapid bursts (bulk Zomato/Swiggy sync) clips the start of the sound.
 */

export type SoundCue = "notification" | "order-received";

const SOURCES: Record<SoundCue, string> = {
  notification: "/sounds/notification.mp3",
  "order-received": "/sounds/order-received.mp3",
};

const POOL_SIZE = 3;
const VOLUME = 0.7;

const pools = new Map<SoundCue, HTMLAudioElement[]>();
const indexes = new Map<SoundCue, number>();

function getPool(cue: SoundCue): HTMLAudioElement[] {
  const existing = pools.get(cue);
  if (existing) return existing;

  const created = Array.from({ length: POOL_SIZE }, () => {
    const el = new Audio(SOURCES[cue]);
    el.volume = VOLUME;
    el.preload = "auto";
    return el;
  });
  pools.set(cue, created);
  indexes.set(cue, 0);
  return created;
}

/** Play a cue. No-op on the server and when autoplay is blocked. */
export function playSound(cue: SoundCue): void {
  if (typeof window === "undefined") return;

  try {
    const pool = getPool(cue);
    const i = indexes.get(cue) ?? 0;
    indexes.set(cue, (i + 1) % pool.length);

    const el = pool[i];
    el.currentTime = 0;
    void el.play().catch(() => {
      /* autoplay blocked until the user interacts with the page */
    });
  } catch {
    /* never let a sound break the socket handler */
  }
}
