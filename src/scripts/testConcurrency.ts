import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { decreaseStock } from "../modules/inventory/inventory.service";

const prisma = new PrismaClient();

async function main() {
  const variantId = process.argv[2];

  if (!variantId) {
    console.error("Usage: npx tsx src/scripts/testConcurrency.ts <variantId>");
    process.exit(1);
  }

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: 1 },
  });

  console.log("Stock set to 1. Firing 5 concurrent purchase attempts for 1 unit each...");

  const attempts = Array.from({ length: 5 }, (_, i) =>
    decreaseStock(variantId, 1, "ORDER_PLACED")
      .then(() => ({ attempt: i + 1, result: "SUCCESS" }))
      .catch((err) => ({ attempt: i + 1, result: "FAILED", message: err.message }))
  );

  const results = await Promise.all(attempts);

  results.forEach((r) => console.log(r));

  const finalVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  console.log(`\nFinal stock in database: ${finalVariant?.stock}`);

  const successCount = results.filter((r) => r.result === "SUCCESS").length;
  console.log(`Successful purchases: ${successCount} (expected: exactly 1)`);

  await prisma.$disconnect();
}

main();