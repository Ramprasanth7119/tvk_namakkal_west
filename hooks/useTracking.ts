import { useState } from "react";
import { TrackingService } from "@/services/tracking.service";

export function useTracking() {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookupTracking = async (id: string) => {
    if (!id.trim()) {
      setError("மனு கண்காணிப்பு எண் தேவை");
      setResult(null);
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await TrackingService.trackComplaint(id);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setLoading(false);
    }
  };

  return {
    trackingId,
    setTrackingId,
    result,
    setResult,
    error,
    setError,
    loading,
    setLoading,
    lookupTracking,
  };
}
