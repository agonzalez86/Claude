import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/check-permissions";

export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const containers = await prisma.container.findMany({
      where: { isArchived: false },
      include: {
        assignedTo: true,
        assignedBy: { select: { id: true, name: true } },
        rentalHistory: true,
      },
    });

    const total = containers.length;
    const free = containers.filter((c) => c.currentStatus === "FREE").length;
    const assignedSale = containers.filter((c) => c.currentStatus === "ASSIGNED_SALE").length;
    const assignedRental = containers.filter((c) => c.currentStatus === "ASSIGNED_RENTAL").length;
    const pendingRevenue = containers.filter((c) => c.currentStatus === "PENDING_REVENUE_CONFIRMATION").length;
    const inTransit = containers.filter((c) => c.currentLocation === "IN_TRANSIT").length;

    const utilized = total - free;
    const utilizationRate = total > 0 ? (utilized / total) * 100 : 0;
    const totalInventoryValue = containers.reduce(
      (sum, c) => sum + Number(c.costWithoutIVA),
      0
    );

    // Status distribution
    const statusDistribution = [
      { name: "Libre", value: free },
      { name: "Asignado (Venta)", value: assignedSale },
      { name: "Asignado (Renta)", value: assignedRental },
      { name: "Pendiente Confirmación", value: pendingRevenue },
    ];

    // Location distribution
    const locationCounts: Record<string, number> = {};
    containers.forEach((c) => {
      locationCounts[c.currentLocation] = (locationCounts[c.currentLocation] || 0) + 1;
    });
    const locationLabels: Record<string, string> = {
      SUPPLIER: "Proveedor",
      MY_WAREHOUSE: "Mi Almacén",
      IN_TRANSIT: "En Tránsito",
      CLIENT_LOCATION: "Cliente",
    };
    const locationDistribution = Object.entries(locationCounts).map(([key, value]) => ({
      name: locationLabels[key] || key,
      value,
    }));

    // Active rentals
    const activeRentals = containers
      .filter((c) => c.currentStatus === "ASSIGNED_RENTAL")
      .map((c) => {
        const startDate = c.rentalStartDate || c.assignedDate;
        const monthsRented = startDate
          ? Math.max(
              Math.ceil(
                (Date.now() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              ),
              1
            )
          : 0;
        return {
          id: c.id,
          seriesNumber: c.seriesNumber,
          internalCode: c.internalCode,
          clientName: c.assignedTo?.name || "",
          startDate: c.rentalStartDate || c.assignedDate,
          expectedReturnDate: c.expectedReturnDate,
          monthsRented,
          monthlyRate: Number(c.monthlyRentalRate || 0),
          projectedRevenue: monthsRented * Number(c.monthlyRentalRate || 0),
          isOverdue: c.expectedReturnDate
            ? new Date(c.expectedReturnDate) < new Date()
            : false,
        };
      })
      .sort((a, b) => {
        if (a.expectedReturnDate && b.expectedReturnDate) {
          return new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime();
        }
        return 0;
      });

    // Idle containers (free, sorted by days idle)
    const idleContainers = containers
      .filter((c) => c.currentStatus === "FREE")
      .map((c) => ({
        id: c.id,
        seriesNumber: c.seriesNumber,
        internalCode: c.internalCode,
        location: c.currentLocation,
        daysIdle: Math.floor(
          (Date.now() - new Date(c.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => b.daysIdle - a.daysIdle);

    // All rental records for performance analysis
    const allRentalRecords = await prisma.rentalRecord.findMany({
      include: { client: true },
    });

    // Top performing containers
    const containerRevenue: Record<string, { seriesNumber: string; internalCode: string; timesRented: number; totalMonths: number; totalRevenue: number }> = {};
    allRentalRecords.forEach((r) => {
      if (!containerRevenue[r.containerId]) {
        const cont = containers.find((c) => c.id === r.containerId);
        containerRevenue[r.containerId] = {
          seriesNumber: cont?.seriesNumber || "",
          internalCode: cont?.internalCode || "",
          timesRented: 0,
          totalMonths: 0,
          totalRevenue: 0,
        };
      }
      containerRevenue[r.containerId].timesRented++;
      containerRevenue[r.containerId].totalMonths += r.durationMonths;
      containerRevenue[r.containerId].totalRevenue += Number(r.finalRevenue);
    });
    const topPerforming = Object.values(containerRevenue)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Sales performance
    const salesPerformance: Record<string, { name: string; assignmentsThisMonth: number; totalAssignments: number; totalRevenue: number }> = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    containers.forEach((c) => {
      if (c.assignedById && c.assignedBy) {
        const id = c.assignedById;
        if (!salesPerformance[id]) {
          salesPerformance[id] = {
            name: c.assignedBy.name,
            assignmentsThisMonth: 0,
            totalAssignments: 0,
            totalRevenue: 0,
          };
        }
        salesPerformance[id].totalAssignments++;
        if (c.assignedDate && new Date(c.assignedDate) >= startOfMonth) {
          salesPerformance[id].assignmentsThisMonth++;
        }
      }
    });
    allRentalRecords.forEach((r) => {
      if (salesPerformance[r.assignedById]) {
        salesPerformance[r.assignedById].totalRevenue += Number(r.finalRevenue);
      }
    });
    const salesPerformanceArr = Object.values(salesPerformance).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // Top clients
    const clientStats: Record<string, { name: string; activeContainers: number; totalRentals: number; totalPurchases: number; totalRevenue: number }> = {};
    containers.forEach((c) => {
      if (c.assignedTo) {
        const cid = c.assignedToId!;
        if (!clientStats[cid]) {
          clientStats[cid] = {
            name: `${c.assignedTo.name} - ${c.assignedTo.company}`,
            activeContainers: 0,
            totalRentals: 0,
            totalPurchases: 0,
            totalRevenue: 0,
          };
        }
        clientStats[cid].activeContainers++;
        if (c.currentStatus === "ASSIGNED_RENTAL") {
          clientStats[cid].totalRentals++;
        } else if (c.currentStatus === "ASSIGNED_SALE") {
          clientStats[cid].totalPurchases++;
        }
      }
    });
    allRentalRecords.forEach((r) => {
      if (!clientStats[r.clientId]) {
        clientStats[r.clientId] = {
          name: `${r.clientName} - ${r.clientCompany}`,
          activeContainers: 0,
          totalRentals: 0,
          totalPurchases: 0,
          totalRevenue: 0,
        };
      }
      clientStats[r.clientId].totalRentals++;
      clientStats[r.clientId].totalRevenue += Number(r.finalRevenue);
    });
    const topClients = Object.values(clientStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 20);

    return NextResponse.json({
      summary: {
        total,
        free,
        assignedSale,
        assignedRental,
        pendingRevenue,
        inTransit,
        utilizationRate,
        totalInventoryValue,
      },
      statusDistribution,
      locationDistribution,
      activeRentals,
      idleContainers,
      topPerforming,
      salesPerformance: salesPerformanceArr,
      topClients,
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json(
      { error: "Error al obtener los análisis" },
      { status: 500 }
    );
  }
}
