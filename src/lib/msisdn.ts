export function maskMsisdn(msisdn: string | null | undefined): string {
  if (!msisdn) return "—";
  const digits = msisdn.replace(/\D/g, "");
  if (digits.length < 6) return "••••";
  return `${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

export function canViewFullMsisdn(role: string | undefined): boolean {
  return role === "ADMIN";
}
