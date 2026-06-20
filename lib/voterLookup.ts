import { getDb } from "./mongodb";
import { readWardNo, formatVoterDob } from "./voterRegistry";

export interface Voter {
  VoterID: string;
  VoterName: string;
  DOB: string;
  WardNo: number | string;
  WardName: string;
  Constituency: string;
  Mobile: string;
  Address: string;
  DoorNo?: string;
}

/**
 * Looks up a voter in the MongoDB voterRegistry collection.
 */
export async function lookupVoter(voterId: string): Promise<Voter | null> {
  const searchId = voterId.trim().toUpperCase();
  if (!searchId) return null;

  try {
    const db = await getDb();
    const doc = await db.collection("voterRegistry").findOne({ voterId: searchId });

    if (!doc) return null;

    const wardNo = readWardNo(doc as Record<string, unknown>);

    return {
      VoterID: doc.voterId,
      VoterName: doc.name || "",
      DOB: formatVoterDob(doc.dob),
      WardNo: wardNo,
      WardName: doc.wardName || "",
      Constituency: doc.constituency || "",
      Mobile: doc.mobile || "",
      Address: doc.address || "",
      DoorNo: doc.doorNo || "",
    };
  } catch (error) {
    console.error("Error looking up voter in database:", error);
    return null;
  }
}
