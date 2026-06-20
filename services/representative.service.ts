import { Representative } from "@/types/representative";

export class RepresentativeService {
  static async getRepresentatives(): Promise<Representative[]> {
    const res = await fetch("/api/admin/representatives");
    if (!res.ok) {
      throw new Error("Failed to fetch representatives");
    }
    return res.json();
  }

  static async createRepresentative(payload: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/admin/representatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async updateRepresentative(payload: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/admin/representatives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}
