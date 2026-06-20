import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";

export interface Voter {
  VoterID: string;
  VoterName: string;
  WardNo: number;
  WardName: string;
  Constituency: string;
  Mobile: string;
  Address: string;
}

let cachedVoters: Voter[] | null = null;

export function loadVoters(): Voter[] {
  if (cachedVoters) {
    return cachedVoters;
  }

  try {
    const filePath = path.join(process.cwd(), "lib", "Voter_List.xlsx");
    if (!fs.existsSync(filePath)) {
      console.error("Voter_List.xlsx not found at:", filePath);
      return [];
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

    cachedVoters = rawData.map((row) => {
      let constituency = String(row.Constituency || "").trim();
      if (constituency === "மல்லசமுத்திரம்") {
        constituency = "நாமக்கல்";
      }
      return {
        VoterID: String(row.VoterID || "").trim(),
        VoterName: String(row.VoterName || "").trim(),
        WardNo: Number(row.WardNo || 0),
        WardName: String(row.WardName || "").trim(),
        Constituency: constituency,
        Mobile: String(row.Mobile || "").trim(),
        Address: String(row.Address || "").trim(),
      };
    });

    return cachedVoters;
  } catch (error) {
    console.error("Error loading Voter_List.xlsx:", error);
    return [];
  }
}

export async function lookupVoter(voterId: string): Promise<Voter | null> {
  const voters = loadVoters();
  const searchId = voterId.trim().toUpperCase();
  const voter = voters.find((v) => v.VoterID.toUpperCase() === searchId);
  return voter || null;
}
