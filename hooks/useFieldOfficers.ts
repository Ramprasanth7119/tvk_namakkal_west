import { useState, useCallback } from "react";
import { FieldOfficer } from "@/types/fieldOfficer";
import { FieldOfficerService } from "@/services/fieldOfficer.service";

export function useFieldOfficers() {
  const [officers, setOfficers] = useState<FieldOfficer[]>([]);
  const [isOfficersLoading, setIsOfficersLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOfficers = useCallback(async () => {
    setIsOfficersLoading(true);
    setError("");
    try {
      const data = await FieldOfficerService.getFieldOfficers();
      setOfficers(data);
    } catch (err) {
      console.error(err);
      setError("களப்பணியாளர்கள் விவரங்களைப் பெறுவதில் பிழை");
    } finally {
      setIsOfficersLoading(false);
    }
  }, []);

  const handleCreateOfficer = async (payload: any) => {
    try {
      const res = await FieldOfficerService.createFieldOfficer(payload);
      if (res.success) {
        await fetchOfficers();
        return { success: true };
      }
      return { success: false, error: res.error || "உருவாக்குவதில் பிழை" };
    } catch {
      return { success: false, error: "இணைப்புப் பிழை" };
    }
  };

  const handleEditOfficer = async (payload: any) => {
    try {
      const res = await FieldOfficerService.updateFieldOfficer(payload);
      if (res.success) {
        await fetchOfficers();
        return { success: true };
      }
      return { success: false, error: res.error || "புதுப்பிப்பதில் பிழை" };
    } catch {
      return { success: false, error: "இணைப்புப் பிழை" };
    }
  };

  return {
    officers,
    setOfficers,
    isOfficersLoading,
    error,
    fetchOfficers,
    handleCreateOfficer,
    handleEditOfficer,
  };
}
