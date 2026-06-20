export function calculateAgeFromDob(dobStr: string): string {
  const raw = String(dobStr || "").trim();
  if (!raw) return "";

  let birth: Date | null = null;
  const parts = raw.split(/[\/\-\.]/).map((p) => p.trim());
  if (parts.length === 3) {
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    const c = Number(parts[2]);
    if (c > 1000) birth = new Date(c, b - 1, a);
    else if (a > 1000) birth = new Date(a, b - 1, c);
  }
  if (!birth || Number.isNaN(birth.getTime())) {
    birth = new Date(raw);
  }
  if (!birth || Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? String(age) : "";
}

export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ta-IN");
}
