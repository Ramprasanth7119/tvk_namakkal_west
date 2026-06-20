import { Complaint } from "@/types/complaint";

export class AnalyticsService {
  static async getPublicAnalytics(constituency?: string): Promise<any> {
    const query = constituency && constituency !== "அனைத்தும்" ? `?constituency=${encodeURIComponent(constituency)}` : "";
    const res = await fetch(`/api/public/analytics${query}`);
    if (!res.ok) {
      throw new Error("Failed to fetch public analytics");
    }
    return res.json();
  }

  static async getResolvedShowcase(): Promise<any[]> {
    try {
      const res = await fetch("/api/public/resolved");
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.error("Error loading resolved showcase:", e);
    }
    return [];
  }

  static async getAdminDashboardStats(): Promise<any> {
    const res = await fetch("/api/admin/dashboard");
    if (!res.ok) {
      throw new Error("Failed to fetch admin dashboard stats");
    }
    return res.json();
  }

  static async getDemoEntries(constituency?: string): Promise<Complaint[]> {
    const query = constituency ? `?constituency=${encodeURIComponent(constituency)}` : "";
    const res = await fetch(`/api/admin/demo${query}`);
    if (!res.ok) {
      throw new Error("Failed to fetch demo entries");
    }
    return res.json();
  }

  static async createDemoEntry(payload: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/admin/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async deleteDemoEntry(id: string, constituency: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/admin/demo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, constituency }),
    });
    return res.json();
  }
}
