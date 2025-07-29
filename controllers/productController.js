const Product = require("../models/Product");
const Store = require("../models/Store");
const mongoose = require("mongoose");

// Mahsulot yaratish
exports.createProduct = async (req, res) => {
  try {
    const {
      product_name,
      model,
      stock,
      purchase_price,
      purchase_currency,
      sell_price,
      sell_currency,
      brand_name,
      storeProduct,
      count_type,
      barcode,
      special_notes,
      kimdan_kelgan,
    } = req.body;

    const newProduct = new Product({
      product_name,
      model,
      stock,
      purchase_price,
      purchase_currency,
      sell_price,
      sell_currency,
      brand_name,
      storeProduct,
      count_type,
      barcode,
      special_notes,
      kimdan_kelgan,
    });

    await newProduct.save();
    res.status(201).json({
      message: "Mahsulot muvaffaqiyatli qo‘shildi",
      product: newProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Barcha mahsulotlarni olish
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mahsulotni yangilash
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    console.log(req.body)


    if (!updatedProduct) {
      return res.status(404).json({ message: "Mahsulot topilmadi" });
    }

    res.status(200).json({
      message: "Mahsulot yangilandi",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mahsulotni o‘chirish
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Mahsulot topilmadi" });
    }

    res.status(200).json({
      message: "Mahsulot o‘chirildi",
      product: deletedProduct,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Barcode orqali mahsulot olish
exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode });

    if (!product) {
      return res.status(404).json({ message: "Mahsulot topilmadi" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
