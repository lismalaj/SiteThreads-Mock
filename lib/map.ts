import type { Site } from './types';

const LAT_MIN = 40.735;
const LAT_MAX = 40.785;
const LNG_MIN = -74.065;
const LNG_MAX = -73.97;

export function toMapPosition(lat: number, lng: number) {
  return {
    x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
  };
}

export function unreadCount(site: Site) {
  return site.threads.reduce(
    (total, thread) => total + thread.messages.filter((message) => message.unread).length,
    0,
  );
}

export function sortedSites(sites: Site[]) {
  return [...sites].sort((a, b) => unreadCount(b) - unreadCount(a));
}
