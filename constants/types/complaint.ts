export interface CitizenDetails {
  name: string;
  mobile: string;
  aadhaar?: string;
  gender: string;
  age: string | number;
  dob: string;
  address: string;
}

export interface ComplaintDetails {
  category: string;
  subcategory: string;
  description: string;
  urgency: string;
}

export interface GeolocationDetails {
  latitude: number | null;
  longitude: number | null;
  timestamp?: string | Date | null;
}

export interface TimelineStep {
  status: string;
  updatedAt: string | Date;
  updatedBy: string;
  notes?: string;
}

export interface Complaint {
  _id?: string;
  trackingId: string;
  voterVerified: boolean;
  voterId: string;
  verificationMethod: string;
  locationAttempts?: number;
  latitude: number | null;
  longitude: number | null;
  locationTimestamp?: string | Date | null;
  ward: string;
  constituency: string;
  citizenDetails: CitizenDetails;
  complaintDetails: ComplaintDetails;
  photoUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  mediaUrls?: {
    photos: string[];
    video?: string;
    audio?: string;
  };
  geolocation?: GeolocationDetails;
  status: string;
  approvalStatus?: string;
  timeline: TimelineStep[];
  createdAt: string | Date;
  updatedAt: string | Date;

  // Additional fields returned by some API or update actions
  assignedTo?: string;
  assignedToName?: string;
  assignedBy?: string;
  assignedAt?: string | Date;
  solvedBy?: string;
  verifiedBy?: string;
  approvedBy?: string;
  beforeImages?: string[];
  afterImages?: string[];
  videos?: string[];
  audios?: string[];
  workNotes?: string;
  representativeApproval?: "APPROVED" | "REJECTED";
  representativeApprovedAt?: string | Date;
  rejectionReason?: string;
  adminApproval?: "APPROVED" | "REJECTED";
  adminApprovedAt?: string | Date;
  adminRejectionReason?: string;
}
