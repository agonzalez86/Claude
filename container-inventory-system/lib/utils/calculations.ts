import { differenceInMonths, differenceInDays, parseISO } from "date-fns";

export function calculateRentalRevenue(
  startDate: Date | string,
  endDate: Date | string,
  monthlyRate: number
): {
  durationMonths: number;
  durationDays: number;
  revenue: number;
} {
  const start =
    typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

  const months = differenceInMonths(end, start);
  const days = differenceInDays(end, start);
  const durationMonths = months > 0 ? months : 1;

  return {
    durationMonths,
    durationDays: days,
    revenue: durationMonths * monthlyRate,
  };
}

export function calculateProjectedRevenue(
  startDate: Date | string,
  monthlyRate: number
): {
  monthsElapsed: number;
  projectedRevenue: number;
} {
  const start =
    typeof startDate === "string" ? parseISO(startDate) : startDate;
  const today = new Date();

  const monthsElapsed = differenceInMonths(today, start);
  const months = monthsElapsed > 0 ? monthsElapsed : 1;

  return {
    monthsElapsed: months,
    projectedRevenue: months * monthlyRate,
  };
}

export function calculateDaysAtLocation(
  locationChangeDate: Date | string
): number {
  const changeDate =
    typeof locationChangeDate === "string"
      ? parseISO(locationChangeDate)
      : locationChangeDate;

  return differenceInDays(new Date(), changeDate);
}
