import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import categoryRoutes from "../modules/categories/category.routes";
import productRoutes from "../modules/products/product.routes";
import inventoryRoutes from "../modules/inventory/inventory.routes";
import cartRoutes from "../modules/cart/cart.routes";
import orderRoutes from "../modules/orders/order.routes";
import paymentRoutes from "../modules/payments/payment.routes";
import notificationRoutes from "../modules/notifications/notification.routes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/admin/inventory", inventoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);

export default router;