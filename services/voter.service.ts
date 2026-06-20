import { Voter } from "@/types/voter";

export class VoterService {
  static async verifyVoter(voterId: string): Promise<{ found: boolean; voter?: Voter; message?: string }> {
    const res = await fetch("/api/voter/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    });
    return res.json();
  }

  static async verifyVoterFallback(
    name: string,
    doorNo: string,
    dob: string,
    wardNo: string
  ): Promise<{ found: boolean; voter?: Voter; message?: string }> {
    const res = await fetch("/api/voter/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isFallback: true,
        name,
        doorNo,
        dob,
        wardNo,
      }),
    });
    return res.json();
  }
}
