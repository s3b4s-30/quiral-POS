export function formatCOP(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "$0";
  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return "$0";
  return "$" + Math.round(num).toLocaleString("es-CO");
}

export function parseCOPInput(raw: string): number {
  if (!raw) return 0;
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatUnits(units: number): string {
  return `${units} uds`;
}

export function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatShortDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

export function formatFullDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateWithTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

export interface WarrantyStatus {
  status: "active" | "expired" | "claimed";
  label: string;
  remainingDays: number;
  elapsedDays: number;
  progressPct: number;
}

export function getWarrantyStatus(
  saleDateISO: string,
  warrantyDays: number = 15,
  warrantyClaimed: boolean = false
): WarrantyStatus {
  const saleDate = new Date(saleDateISO);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - saleDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, warrantyDays - elapsedDays);
  const progressPct =
    warrantyDays > 0
      ? Math.min(100, Math.round((remainingDays / warrantyDays) * 100))
      : 0;

  if (warrantyClaimed) {
    return {
      status: "claimed",
      label: "Garantía Aplicada",
      remainingDays,
      elapsedDays,
      progressPct,
    };
  }

  if (remainingDays <= 0) {
    return {
      status: "expired",
      label: "Garantía Vencida",
      remainingDays: 0,
      elapsedDays,
      progressPct: 0,
    };
  }

  return {
    status: "active",
    label: `${remainingDays} de ${warrantyDays} días restantes`,
    remainingDays,
    elapsedDays,
    progressPct,
  };
}

/**
 * Normaliza y elimina marcas diacríticas (tildes, acentos, diéresis) y convierte a minúsculas
 * para búsquedas e indexaciones ultra-rápidas e insensibles a acentos en el mostrador.
 */
export function foldDiacritics(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
