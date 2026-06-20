/** Google Maps embed URL (no API key required). */
export function getGoogleMapsEmbedUrl(lat: number, lon: number, zoom = 16): string {
  return `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
}

/** Open location in Google Maps (new tab / mobile app). */
export function getGoogleMapsOpenUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
