/**
 * FILTEC Headquarters & Production Facility Exact Location & Distance Utilities
 *
 * Official Address: Water Park Rd, Kurangsasan, Odisha 754002, India
 * Coordinates: 20.294394, 85.943116
 */

export const FILTEC_HQ = {
  name: 'FILTEC Head Office & Plant',
  address: 'Water Park Rd, Kurangsasan, Odisha 754002, India',
  latitude: 20.294394,
  longitude: 85.943116
};

/**
 * Calculate the great-circle distance between two coordinates in meters using the Haversine formula.
 * Defaults to measuring distance from FILTEC HQ if destination is omitted.
 */
export function calculateDistanceMeters(
  lat1?: number | null,
  lon1?: number | null,
  lat2: number = FILTEC_HQ.latitude,
  lon2: number = FILTEC_HQ.longitude
): number {
  if (lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null || isNaN(lat1) || isNaN(lon1)) {
    return 0;
  }
  const R = 6371e3; // Earth's mean radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats a distance in meters into human-readable text relative to FILTEC HQ.
 * Examples:
 *  - "On-site (< 50m from Filtec HQ)"
 *  - "420 m from Filtec HQ"
 *  - "14.2 km from Filtec HQ"
 */
export function formatDistanceToFiltec(meters?: number | null): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '—';
  if (meters < 50) return 'On-site (< 50m from Filtec HQ)';
  if (meters < 1000) return `${Math.round(meters)} m from Filtec HQ`;
  return `${(meters / 1000).toFixed(1)} km from Filtec HQ`;
}

/**
 * Formats a distance into a compact badge string.
 * Examples:
 *  - "On-site"
 *  - "420 m"
 *  - "14.2 km"
 */
export function formatDistanceShort(meters?: number | null): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '—';
  if (meters < 50) return 'On-site';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
