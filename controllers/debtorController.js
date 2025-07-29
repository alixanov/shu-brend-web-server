const Debtor = require("../models/Debtor");
const Sale = require("../models/Sale");
const Store = require("../models/Store");
const Product = require("../models/Product");

exports.createDebtor = async (req, res) => {
  try {
    const { name, phone, due_date, currency, debt_amount, products } = req.body;

    // 🔒 1. Validatsiya
    if (
      !name ||
      !phone ||
      !due_date ||
      !currency ||
      !debt_amount ||
      !products?.length
    ) {
      return res.status(400).json({ message: "Kerakli maydonlar to'liq emas" });
    }

    // 🔁 2. Har bir mahsulot uchun mavjudlikni tekshirish va sonni kamaytirish
    for (const item of products) {
      const storeItem = await Store.findOne({ product_id: item.product_id });

      if (!storeItem) {
        return res
          .status(404)
          .json({ message: `${item.product_name} dokonda topilmadi` });
      }

      if (storeItem.quantity < item.quantity) {
        return res.status(400).json({
          message: `${item.product_name} mahsulotidan dokonda yetarli miqdor yo‘q! Mavjud: ${storeItem.quantity}, So‘ralgan: ${item.quantity}`,
        });
      }

      // ➖ Mahsulot miqdorini kamaytirish
      storeItem.quantity -= item.quantity;
      await storeItem.save(); // ⚠️ `updated_at` avtomatik yangilanadi
    }

    // 📝 3. Qarzdorlikni saqlash
    const newDebtor = new Debtor({
      name,
      phone,
      due_date,
      currency,
      debt_amount,
      products,
    });

    await newDebtor.save();

    return res.status(201).json({
      message: "Qarzdorlik muvaffaqiyatli yaratildi",
      debtor: newDebtor,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

// exports.createPayment = async (req, res) => {
//   try {
//     const { id, amount, currency, rate, payment_method = "naqd" } = req.body;

//     if (!id || !amount || !currency || !rate) {
//       return res.status(400).json({ message: "Kerakli maydonlar to'liq emas" });
//     }

//     const debtor = await Debtor.findById(id);
//     if (!debtor) {
//       return res.status(404).json({ message: "Qarzdor topilmadi" });
//     }

//     // 💰 To‘lovni USDga aylantiramiz
//     const amountInUsd =
//       currency === "usd" ? parseFloat(amount) : parseFloat(amount / rate);

//     const remainingDebt = debtor.debt_amount - amountInUsd;

//     // ✅ Agar to‘liq to‘langan bo‘lsa
//     if (remainingDebt <= 0) {
//       for (const item of debtor.products) {
//         const product = await Product.findById(item.product_id);
//         if (!product) continue;

//         const storeItem = await Store.findOne({ product_id: item.product_id });

//         if (!storeItem || storeItem.quantity < item.quantity) {
//           return res.status(400).json({
//             message: `Omborda ${item.product_name} uchun yetarli mahsulot yo'q`,
//           });
//         }

//         // 📉 Ombordan mahsulotni ayiramiz
//         storeItem.quantity -= item.quantity;
//         await storeItem.save();

//         const total_price = item.sell_price * item.quantity;
//         const total_price_sum =
//           currency === "usd" ? total_price : total_price * rate;

//         await Sale.create({
//           product_id: product._id,
//           product_name: item.product_name,
//           sell_price: item.sell_price,
//           buy_price: product.purchase_price,
//           currency: "usd",
//           quantity: item.quantity,
//           total_price,
//           total_price_sum,
//           payment_method,
//           debtor_name: debtor.name,
//           debtor_phone: debtor.phone,
//           debt_due_date: debtor.due_date,
//         });
//       }

//       // Qarzni to‘liq yopamiz
//       debtor.debt_amount = 0;
//       debtor.products = [];
//       debtor.payment_log = [];
//       await debtor.save();

//       return res.status(200).json({ message: "Qarz to'liq yopildi" });
//     }

//     // ♻️ Qisman to‘lov bo‘lsa — faqat kamaytirish
//     debtor.debt_amount = remainingDebt;
//     debtor.payment_log.push({
//       amount: parseFloat(amount),
//       date: new Date(),
//       currency,
//     });

//     await debtor.save();

//     return res.status(200).json({ message: "Qisman to'lov qabul qilindi" });
//   } catch (err) {
//     console.error(err.message);
//     return res.status(500).json({ message: "Serverda xatolik" });
//   }
// };

exports.editDebtor = async (req, res) => {
  try {
    const { id } = req.params;
    await Debtor.findByIdAndUpdate(id, req.body);
    res.status(200).json({ message: "Qarzdor ma'lumotlari yangilandi" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};
exports.updateDebtor = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, product_id } = req.body;

    const parsedAmount = amount;
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "To'langan summa noto'g'ri" });
    }

    const debtor = await Debtor.findById(id);
    if (!debtor) return res.status(404).json({ message: "Qarzdor topilmadi" });

    debtor.debt_amount -= parsedAmount;
    debtor.payment_log.push({ amount: parsedAmount, date: new Date() });

    // Qarzdor to‘liq to‘ladi, mahsulotlar sotuvga o‘tadi
    if (debtor.debt_amount <= 0) {
      for (const p of debtor.products) {
        const product = await Product.findById(p.product_id);
        await Sale.create({
          product_id: p.product_id,
          product_name: p.product_name,
          sell_price: p.sell_price,
          buy_price: product.purchase_price,
          quantity: p.quantity,
          total_price: p.sell_price * p.quantity,
          payment_method: "qarz",
          debtor_name: debtor.name,
          debtor_phone: debtor.phone,
          debt_due_date: debtor.due_date,
        });
      }

      await debtor.deleteOne();
      return res
        .status(200)
        .json({ message: "Qarz to'liq to'landi va sotuvlar yozildi" });
    }

    await debtor.save();
    res.status(200).json(debtor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getAllDebtors = async (req, res) => {
  try {
    const debtors = await Debtor.find().populate("products.product_id");
    res.status(200).json(debtors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.deleteDebtor = async (req, res) => {
  try {
    const { id } = req.params;
    await Debtor.findByIdAndDelete(id);
    res.status(200).json({ message: "Qarzdor o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.vazvratDebt = async (req, res) => {
  try {
    const { quantity, id, product_id } = req.body;

    const numericQuantity = Number(quantity);
    if (!numericQuantity || isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ message: "Miqdor noto‘g‘ri kiritilgan" });
    }

    const debtor = await Debtor.findById(id);
    if (!debtor) return res.status(404).json({ message: "Qarzdor topilmadi" });

    const product = await Product.findById(product_id);
    if (!product)
      return res.status(404).json({ message: "Mahsulot topilmadi" });

    let storeProduct = await Store.findOne({ product_id });

    if (!storeProduct) {
      storeProduct = await Store.create({
        product_id: product._id,
        product_name: product.product_name,
        quantity: numericQuantity,
      });
    } else {
      storeProduct.quantity += numericQuantity;
      await storeProduct.save();
    }

    const prodIndex = debtor.products.findIndex((p) => {
      const pId =
        typeof p.product_id === "object"
          ? p.product_id._id?.toString()
          : p.product_id?.toString();
      return pId === product_id;
    });

    if (prodIndex === -1) {
      return res.status(404).json({ message: "Mahsulot qarzdorda topilmadi" });
    }

    const item = debtor.products[prodIndex];

    item.quantity -= numericQuantity;
    debtor.debt_amount -= item.sell_price * numericQuantity;

    if (item.quantity <= 0) {
      debtor.products.splice(prodIndex, 1);
    }

    await debtor.save();

    res.status(200).json({ message: "Mahsulot qaytarildi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { id, amount, currency, rate, payment_method = "naqd" } = req.body;

    if (!id || !amount || !currency || !rate) {
      return res
        .status(400)
        .json({ message: "Kerakli maydonlar to'liq emas" });
    }

    const debtor = await Debtor.findById(id);
    if (!debtor) {
      return res.status(404).json({ message: "Qarzdor topilmadi" });
    }

    if (!debtor.currency) {
      return res
        .status(400)
        .json({ message: "Qarzdor valyutasi belgilanmagan" });
    }

    const debtorAmountInUsd =
      debtor.currency === "usd"
        ? parseFloat(debtor.debt_amount)
        : parseFloat(debtor.debt_amount / rate);

    // 2. To‘lovni USDga aylantiramiz
    const amountInUsd =
      currency === "usd"
        ? parseFloat(amount)
        : parseFloat(amount / rate);

    const remainingDebtUsd = debtorAmountInUsd - amountInUsd;

    const newDebtAmount =
      debtor.currency === "usd"
        ? remainingDebtUsd
        : remainingDebtUsd * rate;

    if (remainingDebtUsd <= 0) {
      for (const item of debtor.products) {
        const product = await Product.findById(item.product_id);
        if (!product) continue;

        const storeItem = await Store.findOne({ product_id: item.product_id });

        if (!storeItem || storeItem.quantity < item.quantity) {
          return res.status(400).json({
            message: `Omborda ${item.product_name} uchun yetarli mahsulot yo'q`,
          });
        }

        // Ombordan mahsulotni ayiramiz
        storeItem.quantity -= item.quantity;
        await storeItem.save();

        const total_price = item.sell_price * item.quantity;
        const total_price_sum =
          currency === "usd" ? total_price : total_price * rate;

        await Sale.create({
          product_id: product._id,
          product_name: item.product_name,
          sell_price: item.sell_price,
          buy_price: product.purchase_price,
          currency: "usd", // har doim USD saqlaymiz
          quantity: item.quantity,
          total_price,
          total_price_sum,
          payment_method,
          debtor_name: debtor.name,
          debtor_phone: debtor.phone,
          debt_due_date: debtor.due_date,
        });
      }

      // Qarzni to‘liq yopamiz
      debtor.debt_amount = 0;
      debtor.products = [];
      debtor.payment_log = [];
      await debtor.save();

      return res.status(200).json({ message: "Qarz to'liq yopildi" });
    }

    // 6. Aks holda, qarzni kamaytirib saqlaymiz
    debtor.debt_amount = newDebtAmount;
    debtor.payment_log.push({
      amount: parseFloat(amount),
      date: new Date(),
      currency,
    });
    await debtor.save();

    return res.status(200).json({ message: "Qisman to'lov qabul qilindi" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};


// ❌ Qarzdorni o‘chirish
exports.deleteDebtor = async (req, res) => {
  try {
    const { id } = req.params;
    const debtor = await Debtor.findById(id);
    if (!debtor) {
      return res.status(404).json({ message: "Qarzdor topilmadi" });
    }

    await debtor.deleteOne();
    res.status(200).json({ message: "Qarzdor o‘chirildi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
