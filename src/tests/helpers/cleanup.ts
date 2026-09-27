import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export async function cleanupTestData() {
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: "@test.local" } },
    select: { id: true },
  });
  const userIds = testUsers.map((u) => u.id);

  const testOrders = await prisma.order.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const orderIds = testOrders.map((o) => o.id);

  await prisma.paymentEvent.deleteMany({ where: { payment: { orderId: { in: orderIds } } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });

  await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: userIds } } } });
  await prisma.cart.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.address.deleteMany({ where: { userId: { in: userIds } } });

  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  const testVariants = await prisma.productVariant.findMany({
    where: { sku: { startsWith: "RACE-" } },
    select: { id: true, productId: true },
  });
  const variantIds = testVariants.map((v) => v.id);
  const productIds = [...new Set(testVariants.map((v) => v.productId))];

  await prisma.inventoryMovement.deleteMany({ where: { variantId: { in: variantIds } } });
  await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.category.deleteMany({ where: { slug: "race-test-category" } });
}