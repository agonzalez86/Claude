import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(
  date: Date | string,
  formatStr: string = "dd/MM/yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
