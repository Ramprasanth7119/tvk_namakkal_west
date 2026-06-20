export function getGoogleMapsEmbedUrl(lat: number, lon: number, zoom = 16): string {
  return `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
}

export function getGoogleMapsOpenUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
