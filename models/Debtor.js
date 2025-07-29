
const mongoose = require("mongoose");


const debtorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    debt_amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    currency: { type: String, enum: ["sum", "usd"], required: true },
    payment_log: {
      type: [
        {
          amount: { type: Number, required: true },
          currency: { type: String, required: true, default: "usd" },
          date: { type: Date, default: Date.now },
        }
      ],
      default: [],
    },
    
    products: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        product_name: { type: String, required: true },
        quantity: { type: Number, required: true },
        sell_price: { type: Number, required: true },
        sold_date: { type: Date, default: Date.now },
        due_date: { type: Date, required: true },
        currency: {
          type: String,
          enum: ["usd", "sum"],
          // required: true
        }
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debtor", debtorSchema);
// 