const mongoose = require("mongoose");

const nasiyaSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    location: {
      type: String,
      enum: ["dokon", "skalad"],
      required: true,
    },
    product_name: { type: String, required: true },
    nasiya_name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Nasiya", nasiyaSchema);
