import { useState, useEffect, useMemo, useCallback } from "react";
import { Complaint } from "@/types/complaint";
import { ComplaintService } from "@/services/complaint.service";
import { normalizeStatus } from "@/lib/complaintStatus";

export function useComplaints(initialArea = "அனைத்தும்") {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [error, setError] = useState("");

  // Filters state
  const [curArea, setCurArea] = useState(initialArea);
  const [curStatus, setCurStatus] = useState("all");
  const [curCategory, setCurCategory] = useState("அனைத்தும்");
  const [curSearch, setCurSearch] = useState("");

  // Selection state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");

  const fetchComplaints = useCallback(async () => {
    setIsLoadingComplaints(true);
    setError("");
    try {
      const data = await ComplaintService.getComplaints();
      setComplaints(data);
    } catch (err: any) {
      console.error(err);
      setError("புகார்களைப் பெறுவதில் பிழை ஏற்பட்டது");
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  const handleUpdateStatus = async (trackingId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const data = await ComplaintService.updateStatus(trackingId, newStatus);
      if (data.success) {
        setStatusUpdateMessage("நிலை புதுப்பிக்கப்பட்டது!");
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: newStatus } : c))
        );
        setSelectedComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchComplaints();
        return { success: true };
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "புதுப்பிக்க முடியவில்லை"}`);
        return { success: false, error: data.error };
      }
    } catch (err) {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
      return { success: false, error: "Connection error" };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignOfficer = async (trackingId: string, officerUsername: string, officerName: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const data = await ComplaintService.assignOfficer(trackingId, officerUsername);
      if (data.success) {
        setStatusUpdateMessage("களப்பணியாளர் வெற்றிகரமாக ஒதுக்கப்பட்டார்!");
        setComplaints((prev) =>
          prev.map((c) =>
            c.trackingId === trackingId
              ? { ...c, status: "assigned", assignedTo: officerUsername, assignedToName: officerName }
              : c
          )
        );
        setSelectedComplaint((prev) =>
          prev
            ? { ...prev, status: "assigned", assignedTo: officerUsername, assignedToName: officerName }
            : null
        );
        fetchComplaints();
        return { success: true };
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "ஒதுக்க முடியவில்லை"}`);
        return { success: false, error: data.error };
      }
    } catch {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
      return { success: false, error: "Connection error" };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRepReview = async (trackingId: string, approve: boolean, rejectionReason: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const data = approve
        ? await ComplaintService.repApprove(trackingId)
        : await ComplaintService.repReject(trackingId, rejectionReason);

      if (data.success) {
        const nextStatus = approve ? "pending_admin_approval" : "work_in_progress";
        setStatusUpdateMessage(
          approve ? "மனு வெற்றிகரமாக அங்கீகரிக்கப்பட்டது!" : "❌ மனு நிராகரிக்கப்பட்டு மீண்டும் களப்பணிக்கு அனுப்பப்பட்டது."
        );
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: nextStatus } : c))
        );
        setSelectedComplaint((prev) => (prev ? { ...prev, status: nextStatus } : null));
        fetchComplaints();
        return { success: true };
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "புதுப்பிக்க முடியவில்லை"}`);
        return { success: false, error: data.error };
      }
    } catch {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
      return { success: false, error: "Connection error" };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAdminApproval = async (trackingId: string, approve: boolean, rejectionReason: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const data = approve
        ? await ComplaintService.adminApprove(trackingId)
        : await ComplaintService.adminReject(trackingId, rejectionReason);

      if (data.success) {
        setStatusUpdateMessage(
          approve
            ? "மனு வெற்றிகரமாக தீர்க்கப்பட்டது!"
            : "❌ மனு நிராகரிக்கப்பட்டு மீண்டும் களப்பணிக்கு அனுப்பப்பட்டது."
        );
        fetchComplaints();
        return { success: true };
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "ஒதுக்க முடியவில்லை"}`);
        return { success: false, error: data.error };
      }
    } catch {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
      return { success: false, error: "Connection error" };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Area filter
      if (curArea !== "அனைத்தும்" && c.constituency !== curArea) return false;

      // Status filter
      const cStatus = normalizeStatus(c.status);
      if (curStatus !== "all") {
        if (curStatus === "pend") {
          if (cStatus !== "registered" && cStatus !== "under_review") return false;
        } else if (curStatus === "warn") {
          if (cStatus === "registered" || cStatus === "under_review" || cStatus === "resolved") return false;
        } else if (curStatus === "ok") {
          if (cStatus !== "resolved") return false;
        } else {
          if (cStatus !== curStatus) return false;
        }
      }

      // Category filter
      if (curCategory !== "அனைத்தும்" && c.complaintDetails?.category !== curCategory) return false;

      // Search query filter
      if (curSearch.trim() !== "") {
        const searchLower = curSearch.toLowerCase();
        const trackingId = (c.trackingId || "").toLowerCase();
        const citizenName = (c.citizenDetails?.name || "").toLowerCase();
        const description = (c.complaintDetails?.description || "").toLowerCase();
        const phone = (c.citizenDetails?.mobile || "").toLowerCase();
        const voterId = (c.voterId || "").toLowerCase();

        return (
          trackingId.includes(searchLower) ||
          citizenName.includes(searchLower) ||
          description.includes(searchLower) ||
          phone.includes(searchLower) ||
          voterId.includes(searchLower)
        );
      }
      return true;
    });
  }, [complaints, curArea, curStatus, curCategory, curSearch]);

  return {
    complaints,
    setComplaints,
    isLoadingComplaints,
    error,
    fetchComplaints,
    curArea,
    setCurArea,
    curStatus,
    setCurStatus,
    curCategory,
    setCurCategory,
    curSearch,
    setCurSearch,
    selectedComplaint,
    setSelectedComplaint,
    isUpdatingStatus,
    statusUpdateMessage,
    setStatusUpdateMessage,
    handleUpdateStatus,
    handleAssignOfficer,
    handleRepReview,
    handleAdminApproval,
    filteredComplaints,
  };
}
