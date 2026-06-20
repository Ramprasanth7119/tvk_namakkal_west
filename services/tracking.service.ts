export class TrackingService {
  static async trackComplaint(trackingId: string): Promise<any> {
    const cleanId = trackingId.trim().toUpperCase();
    const res = await fetch(`/api/track?trackingId=${encodeURIComponent(cleanId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "மனு கண்டறியப்படவில்லை");
    }
    return data;
  }
}
