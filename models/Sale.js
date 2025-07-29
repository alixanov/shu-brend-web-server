const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    product_name: { type: String, required: true },
    sell_price: { type: Number, required: true },
    buy_price: { type: Number, required: true },
    currency: {
      type: String,
      enum: ["sum", "usd"],
      default: "sum",
    },
    quantity: { type: Number, required: true },
    total_price: { type: Number, required: true },
    total_price_sum: { type: Number },
    payment_method: {
      type: String,
      enum: ["naqd", "plastik", "qarz"],
      required: true,
    },
    debtor_name: { type: String },
    debtor_phone: { type: String },
    debt_due_date: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
//
