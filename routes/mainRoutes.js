const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const saleController = require("../controllers/saleController");
const debtorController = require("../controllers/debtorController");
const storeController = require("../controllers/storeController");
const budgetController = require("../controllers/budgetController");
const masterController = require("../controllers/masterController");
const expenseController = require("../controllers/expenseController");
const usdRateController = require("../controllers/UsdRateController");
const nasiyaController = require("../controllers/nasiyaController");

// Middleware
const authMiddleware = require("../middleware/authMiddleware");

// ==== AUTH ROUTES ====
router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.post(
  "/create-admin",
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(["admin"]),
  adminController.createAdmin
);
router.get(
  "/admins",
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(["admin"]),
  adminController.getAllAdmins
);
router.delete(
  "/admin/:id",
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(["admin"]),
  adminController.deleteAdmin
);
router.put(
  "/admin/:id",
  authMiddleware.verifyToken,
  authMiddleware.verifyRole(["admin"]),
  adminController.updateAdmin
);

// ==== PRODUCT ROUTES ====
router.post(
  "/products",
  authMiddleware.verifyToken,
  productController.createProduct
);
router.get(
  "/products",
  authMiddleware.verifyToken,
  productController.getAllProducts
);
router.put(
  "/products/:id",
  authMiddleware.verifyToken,
  productController.updateProduct
);
router.delete(
  "/products/:id",
  authMiddleware.verifyToken,
  productController.deleteProduct
);
router.get("/products/barcode/:barcode", productController.getProductByBarcode);

// ==== SALES ROUTES ====
router.post("/sales", saleController.recordSale);
router.delete(
  "/sales/:id",
  authMiddleware.verifyToken,
  saleController.deleteSale
);
router.get("/sales", saleController.getSalesHistory);
router.get("/sales/daily", saleController.getDailySales);
router.get("/sales/weekly", saleController.getWeeklySales);
router.get("/sales/monthly", saleController.getMonthlySales);
router.get("/sales/yearly", saleController.getYearlySales);
router.get("/stock/compare", saleController.compareStockLevels);
router.get(
  "/stat/year",
  authMiddleware.verifyToken,
  saleController.getLast12MonthsSales
);

// ==== DEBTOR ROUTES ====
router.post(
  "/debtors",
  authMiddleware.verifyToken,
  debtorController.createDebtor
);
router.put(
  "/debtor/:id",
  authMiddleware.verifyToken,
  debtorController.editDebtor
);

router.post(
  "/pay/debtor",
  authMiddleware.verifyToken,
  debtorController.createPayment
);
router.get(
  "/debtors",
  authMiddleware.verifyToken,
  debtorController.getAllDebtors
);
router.put(
  "/debtors/:id",
  authMiddleware.verifyToken,
  debtorController.updateDebtor
);
router.delete(
  "/debtors/:id",
  authMiddleware.verifyToken,
  debtorController.deleteDebtor
);
router.post(
  "/debtors/return",
  authMiddleware.verifyToken,
  debtorController.vazvratDebt
);

// ==== NASIYA ROUTES ====
router.post(
  "/nasiya/create",
  authMiddleware.verifyToken,
  nasiyaController.createNasiya
);
router.get(
  "/nasiya/get",
  authMiddleware.verifyToken,
  nasiyaController.getNasiya
);
router.post(
  "/nasiya/complete/:id",
  authMiddleware.verifyToken,
  nasiyaController.completeNasiya
);

// ==== STORE ROUTES ====
router.post("/store/add", storeController.addProductToStore);
router.get("/store", storeController.getStoreProducts);
router.delete("/store/:id", storeController.removeProductFromStore);
router.post("/store/sell", storeController.sellProductFromStore);
router.post("/store/return", storeController.vazvratTovar);
router.post("/store/product/create", storeController.createProductToStore);
router.post("/store/quantity/:id", storeController.updateStoreProduct);

// ==== BUDGET ROUTES ====
router.get("/budget", budgetController.getBudget);
router.put("/budget", budgetController.updateBudget);

// ==== EXPENSE ROUTES ====
router.post("/harajat/expenses", expenseController.addExpense);
router.get("/harajat/expenses", expenseController.getExpenses);

// ==== USD RATE ROUTES ====
router.get("/usd", usdRateController.getUsdRate);
router.post("/usd", usdRateController.updateUsdRate);

// ==== MASTER (USTA) ROUTES ====
router.post(
  "/master",
  authMiddleware.verifyToken,
  masterController.createMaster
);
router.get("/masters", authMiddleware.verifyToken, masterController.getMasters);
router.post(
  "/master/:master_id/car",
  authMiddleware.verifyToken,
  masterController.createCarToMaster
);
router.post(
  "/master/:master_id/car/:car_id/sale",
  authMiddleware.verifyToken,
  masterController.createSaleToCar
);
router.post(
  "/master/:master_id/payment",
  authMiddleware.verifyToken,
  masterController.createPaymentToMaster
);
router.delete(
  "/master/:master_id/delete",
  authMiddleware.verifyToken,
  masterController.deleteMasterById
);
router.delete(
  "/master/:master_id/cars/:car_id",
  authMiddleware.verifyToken,
  masterController.deleteCarFromMaster
);

// ==== TESTING ====
router.get("/protected-route", authMiddleware.verifyToken, (req, res) => {
  res.status(200).send("This is a protected route");
});

module.exports = router;
