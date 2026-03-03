import { LRUCache } from "lru-cache";

const cache = new LRUCache({ max: 200, ttl: 1000 * 60 * 10 });

function toRad(v) {
  return (v * Math.PI) / 180;
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default async function shopsGoogle({ query, location, radiusMeters = 6000 }) {
  if (!location?.lat || !location?.lng) return [];

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const key = `${query}:${location.lat.toFixed(3)}:${location.lng.toFixed(3)}:${radiusMeters}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${location.lat},${location.lng}`);
  url.searchParams.set("radius", `${radiusMeters}`);
  url.searchParams.set("keyword", `${query} auto repair`);
  url.searchParams.set("key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) return [];

  const data = await resp.json();

  const results = (data.results || []).slice(0, 8).map((p) => {
    const loc = p.geometry?.location;
    const distanceKm =
      loc?.lat && loc?.lng ? haversineKm(location, loc) : null;

    return {
      name: p.name,
      rating: p.rating ?? null,
      ratingsTotal: p.user_ratings_total ?? null,
      openNow: p.opening_hours?.open_now ?? null,
      address: p.vicinity ?? "",
      placeId: p.place_id,
      distanceKm: distanceKm ? Number(distanceKm.toFixed(2)) : null,
      mapsUrl: p.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}`
        : null,
    };
  });

  results.sort((a, b) => {
    const ao = a.openNow === true ? 1 : 0;
    const bo = b.openNow === true ? 1 : 0;
    if (ao !== bo) return bo - ao;

    const ar = a.rating ?? 0;
    const br = b.rating ?? 0;
    if (ar !== br) return br - ar;

    const ad = a.distanceKm ?? 9999;
    const bd = b.distanceKm ?? 9999;
    return ad - bd;
  });

  cache.set(key, results);
  return results;
}