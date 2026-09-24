import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";

const prisma = new PrismaClient();

export async function createNotification(params: {
  userId: string;
  isForAdmin: boolean;
  type: string;
  message: string;
  relatedOrderId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      isForAdmin: params.isForAdmin,
      type: params.type,
      message: params.message,
      relatedOrderId: params.relatedOrderId,
    },
  });
}

export async function notifyAllAdmins(params: {
  type: string;
  message: string;
  relatedOrderId?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      isForAdmin: true,
      type: params.type,
      message: params.message,
      relatedOrderId: params.relatedOrderId,
    })),
  });
}

export async function listNotificationsForUser(userId: string, isForAdmin: boolean) {
  return prisma.notification.findMany({
    where: { userId, isForAdmin },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }

  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}