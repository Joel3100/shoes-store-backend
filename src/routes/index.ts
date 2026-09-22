import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes"
import categoryRoutes from "../modules/categories/category.routes";
import productRoutes from "../modules/products/product.routes";
import inventoryRoutes from "../modules/inventory/inventort.routes";
import cartRoutes from "../modules/cart/cart.routes";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/admin/inventory", inventoryRoutes);
router.use("/cart", cartRoutes);

export default router;