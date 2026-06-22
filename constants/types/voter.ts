export interface Voter {
  _id?: string;
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
