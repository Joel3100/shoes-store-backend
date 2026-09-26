import { PrismaClient, Prisma } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export async function getDashboardSummary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todaySalesResult,
    totalSalesResult,
    orderCountsByStatus,
    lowStockCount,
    recentOrders,
    recentPayments,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: startOfToday } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.productVariant.count({
      where: { isActive: true, stock: { lte: 5 } },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true } } },
    }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { order: { select: { id: true, userId: true } } },
    }),
  ]);

  return {
    todaySales: {
      total: todaySalesResult._sum.totalAmount ?? new Prisma.Decimal(0),
      orderCount: todaySalesResult._count,
    },
    totalSales: {
      total: totalSalesResult._sum.totalAmount ?? new Prisma.Decimal(0),
      orderCount: totalSalesResult._count,
    },
    ordersByStatus: orderCountsByStatus.reduce((acc, row) => {
      acc[row.status] = row._count;
      return acc;
    }, {} as Record<string, number>),
    lowStockCount,
    recentOrders,
    recentPayments,
  };
}