export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  REPRESENTATIVE: "REPRESENTATIVE",
  FIELD_OFFICER: "FIELD_OFFICER",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
