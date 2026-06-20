import { Complaint } from "@/types/complaint";

export class ComplaintService {
  static async getComplaints(): Promise<Complaint[]> {
    const res = await fetch("/api/complaints");
    if (!res.ok) {
      throw new Error("Failed to fetch complaints");
    }
    return res.json();
  }

  static async submitComplaint(payload: any): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async updateStatus(trackingId: string, status: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, status }),
    });
    return res.json();
  }

  static async assignOfficer(trackingId: string, assignedTo: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "assign", assignedTo }),
    });
    return res.json();
  }

  static async startWork(trackingId: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "start_work" }),
    });
    return res.json();
  }

  static async submitSolution(
    trackingId: string, 
    beforeImages: string[], 
    afterImages: string[], 
    videos: string[], 
    workNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId,
        action: "submit_solution",
        beforeImages,
        afterImages,
        videos,
        workNotes,
      }),
    });
    return res.json();
  }

  static async repApprove(trackingId: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "rep_approve" }),
    });
    return res.json();
  }

  static async repReject(trackingId: string, rejectionReason: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "rep_reject", rejectionReason }),
    });
    return res.json();
  }

  static async adminApprove(trackingId: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "admin_approve" }),
    });
    return res.json();
  }

  static async adminReject(trackingId: string, rejectionReason?: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId, action: "admin_reject", rejectionReason }),
    });
    return res.json();
  }
}
