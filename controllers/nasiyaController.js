const Nasiya = require("../models/nasiyaModel");
const Sale = require("../models/Sale");
const Store = require("../models/Store");
const Product = require("../models/Product");

exports.createNasiya = async (req, res) => {
  try {
    const { product_id, quantity, location, nasiya_name } = req.body;

    // Validatsiya
    if (!product_id || !quantity || !location || !nasiya_name) {
      return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring" });
    }

    // Mahsulot mavjudligini va yetarliligini tekshirish
    if (location === "dokon") {
      const storeProduct = await Store.findOne({ product_id });
      if (!storeProduct) {
        return res
          .status(404)
          .json({ message: "Do‘kondagi mahsulot topilmadi" });
      }
      if (storeProduct.quantity < quantity) {
        return res
          .status(400)
          .json({ message: "Do‘konda yetarli mahsulot yo‘q" });
      }
      await Store.findOneAndUpdate(
        { product_id },
        { $inc: { quantity: -quantity } }
      );
    } else {
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({ message: "Mahsulot topilmadi" });
      }
      if (product.stock < quantity) {
        return res
          .status(400)
          .json({ message: "Skaladda yetarli mahsulot yo‘q" });
      }
      await Product.findByIdAndUpdate(product_id, {
        $inc: { stock: -quantity },
      });
    }

    // Nasiya yaratish
    const newNasiya = await Nasiya.create({
      product_id,
      quantity,
      location,
      nasiya_name,
      status: "active", // Statusni aniq qo‘shish
      product_name: (await Product.findById(product_id))?.product_name, // Mahsulot nomini qo‘shish
    });

    res.status(201).json({ message: "Nasiya qo'shildi", data: newNasiya });
  } catch (err) {
    console.error("Xatolik:", err.message);
    return res
      .status(500)
      .json({ message: "Serverda xatolik", error: err.message });
  }
};

exports.getNasiya = async (req, res) => {
  try {
    // Faqat faol nasiyalarni qaytarish
    const nasiyas = await Nasiya.find({ status: "active" });
    res.status(200).json(nasiyas);
  } catch (error) {
    console.error("Xatolik:", error.message);
    return res
      .status(500)
      .json({ message: "Server xatosi", error: error.message });
  }
};

exports.completeNasiya = async (req, res) => {
  try {
    const { id } = req.params; // URL orqali keladi deb taxmin qilindi
    const { payment_method, sell_price } = req.body;

    // Validatsiya
    if (!id || !payment_method || !sell_price) {
      return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring" });
    }

    // Nasiya mavjudligini tekshirish
    const nasiya = await Nasiya.findById(id);
    if (!nasiya) {
      return res.status(404).json({ message: "Nasiya topilmadi" });
    }

    // Mahsulot mavjudligini tekshirish
    const tovar = await Product.findById(nasiya.product_id);
    if (!tovar) {
      return res.status(404).json({ message: "Mahsulot topilmadi" });
    }

    // Sotuvni yaratish
    const sale = await Sale.create({
      product_id: nasiya.product_id,
      product_name: nasiya.product_name,
      sell_price: Number(sell_price), // Raqam ekanligiga ishonch hosil qilish
      buy_price: tovar.purchase_price,
      quantity: nasiya.quantity,
      total_price: Number(sell_price) * nasiya.quantity,
      payment_method,
      debtor_name: "",
      debtor_phone: "",
      debt_due_date: null,
    });

    // Nasiya statusini o‘zgartirish
    await Nasiya.findByIdAndUpdate(id, { status: "inactive" });

    res.status(200).json({ message: "Nasiya tugatildi", data: sale });
  } catch (err) {
    console.error("Xatolik:", err.message);
    return res
      .status(500)
      .json({ message: "Serverda xatolik", error: err.message });
  }
};
