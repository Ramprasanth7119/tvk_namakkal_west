import { useState, useCallback } from "react";
import { AnalyticsService } from "@/services/analytics.service";
import { Complaint } from "@/types/complaint";

export function useAnalytics(initialArea = "அனைத்தும்") {
  const [curArea, setCurArea] = useState(initialArea);
  const [curStatus, setCurStatus] = useState("all");
  const [curSearch, setCurSearch] = useState("");
  const [demoMode, setDemoMode] = useState(true);

  const [publicAnalytics, setPublicAnalytics] = useState<any>(null);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  const [managedDemoData, setManagedDemoData] = useState<Complaint[]>([]);
  const [isManagedDemoLoading, setIsManagedDemoLoading] = useState(false);

  const fetchPublicAnalytics = useCallback(async (area: string) => {
    setIsPublicLoading(true);
    try {
      const data = await AnalyticsService.getPublicAnalytics(area);
      setPublicAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublicLoading(false);
    }
  }, []);

  const fetchDemoEntries = useCallback(async (area?: string) => {
    setIsManagedDemoLoading(true);
    try {
      const data = await AnalyticsService.getDemoEntries(area);
      setManagedDemoData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsManagedDemoLoading(false);
    }
  }, []);

  return {
    curArea,
    setCurArea,
    curStatus,
    setCurStatus,
    curSearch,
    setCurSearch,
    demoMode,
    setDemoMode,
    publicAnalytics,
    setPublicAnalytics,
    isPublicLoading,
    setIsPublicLoading,
    managedDemoData,
    setManagedDemoData,
    isManagedDemoLoading,
    setIsManagedDemoLoading,
    fetchPublicAnalytics,
    fetchDemoEntries,
  };
}
