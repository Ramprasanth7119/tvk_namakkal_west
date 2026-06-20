import { FieldOfficer } from "@/types/fieldOfficer";

export class FieldOfficerService {
  static async getFieldOfficers(): Promise<FieldOfficer[]> {
    const res = await fetch("/api/representative/officers");
    if (!res.ok) {
      throw new Error("Failed to fetch field officers");
    }
    return res.json();
  }

  static async createFieldOfficer(payload: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/representative/officers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async updateFieldOfficer(payload: any): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/representative/officers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}
