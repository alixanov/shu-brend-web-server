const mongoose = require("mongoose");

const MasterSchema = new mongoose.Schema(
  {
    master_name: {
      type: String,
      required: true,
    },
    cars: {
      type: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          car_name: String,
          sales: {
            type: [
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
                quantity: { type: Number, required: true, min: 0 },
                total_price: { type: Number, required: true },
                total_price_sum: { type: Number },
              },
            ],
            default: [],
          },
          payment_log: {
            type: [
              {
                amount: {
                  type: Number,
                  required: true,
                },
                date: {
                  type: Date,
                  default: Date.now,
                },
                currency: {
                  type: String,
                  enum: ["usd", "sum"],
                  default: "sum",
                },
                payment_method: {
                  type: String,
                  enum: ["cash", "card"],
                },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Master", MasterSchema);
