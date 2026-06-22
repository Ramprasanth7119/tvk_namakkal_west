export type UserRole = "SUPER_ADMIN" | "REPRESENTATIVE" | "FIELD_OFFICER";

export interface User {
  _id?: string;
  username: string;
  role: UserRole;
  constituency?: string;
  name?: string;
  phone?: string;
  active?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
