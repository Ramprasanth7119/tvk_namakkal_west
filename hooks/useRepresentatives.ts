import { useState, useCallback } from "react";
import { Representative } from "@/types/representative";
import { RepresentativeService } from "@/services/representative.service";

export function useRepresentatives() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isRepsLoading, setIsRepsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRepresentatives = useCallback(async () => {
    setIsRepsLoading(true);
    setError("");
    try {
      const data = await RepresentativeService.getRepresentatives();
      setRepresentatives(data);
    } catch (err) {
      console.error(err);
      setError("பிரதிநிதிகள் விவரங்களைப் பெறுவதில் பிழை");
    } finally {
      setIsRepsLoading(false);
    }
  }, []);

  const handleCreateRep = async (payload: any) => {
    try {
      const res = await RepresentativeService.createRepresentative(payload);
      if (res.success) {
        await fetchRepresentatives();
        return { success: true };
      }
      return { success: false, error: res.error || "உருவாக்குவதில் பிழை" };
    } catch {
      return { success: false, error: "இணைப்புப் பிழை" };
    }
  };

  const handleUpdateRep = async (payload: any) => {
    try {
      const res = await RepresentativeService.updateRepresentative(payload);
      if (res.success) {
        await fetchRepresentatives();
        return { success: true };
      }
      return { success: false, error: res.error || "புதுப்பிப்பதில் பிழை" };
    } catch {
      return { success: false, error: "இணைப்புப் பிழை" };
    }
  };

  return {
    representatives,
    setRepresentatives,
    isRepsLoading,
    error,
    fetchRepresentatives,
    handleCreateRep,
    handleUpdateRep,
  };
}
