import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "../generated/prisma/client";
import { cleanupTestData } from "./helpers/cleanup";
import app from "../app";

const prisma = new PrismaClient();

describe("Checkout concurrency", () => {
  let variantId: string;
  const userSessions: any[] = [];

  beforeAll(async () => {
    await cleanupTestData();

    const category = await prisma.category.create({
      data: { name: "Race Test Category", slug: "race-test-category" },
    });
    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: "Race Test Shoe",
        slug: "race-test-shoe",
        brand: "TestBrand",
        basePrice: 1000,
      },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, color: "Black", size: "42", sku: "RACE-001", stock: 1 },
    });
    variantId = variant.id;

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/register").send({
        email: `racer${i}@test.local`,
        password: "password123",
        fullName: `Racer ${i}`,
      });

      const agent = request.agent(app);
      await agent.post("/api/auth/login").send({
        email: `racer${i}@test.local`,
        password: "password123",
      });
      await agent.post("/api/cart/items").send({ variantId, quantity: 1 });

      userSessions.push(agent);
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("allows exactly one of five simultaneous checkouts to succeed for one unit of stock", async () => {
    const checkoutBody = {
      recipientName: "Test Racer",
      recipientPhone: "0911111111",
      shippingCity: "Addis Ababa",
      shippingStreet: "Test Street",
    };

    const results = await Promise.all(
      userSessions.map((agent) => agent.post("/api/orders").send(checkoutBody))
    );

    const successCount = results.filter((r) => r.status === 201).length;
    const failureCount = results.filter((r) => r.status === 409).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(4);

    const finalVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(finalVariant?.stock).toBe(0);
  });
});