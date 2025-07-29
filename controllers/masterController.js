const Master = require("../models/Master");
const Sale = require("../models/Sale");
const Rate = require("../models/UsdRate");

exports.createMaster = async (req, res) => {
  try {
    const master = await Master.create(req.body);
    return res.json({ result: master });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.getMasters = async (req, res) => {
  try {
    const masters = await Master.find();
    return res.json(masters);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.createCarToMaster = async (req, res) => {
  try {
    const { master_id } = req.params;

    const master = await Master.findByIdAndUpdate(
      master_id,
      { $push: { cars: req.body } },
      { new: true }
    );

    const newCar = master.cars[master.cars.length - 1];

    return res.json({ car: newCar, master_id });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.createSaleToCar = async (req, res) => {
  try {
    const { master_id, car_id } = req.params;
    const master = await Master.findById(master_id);
    const car = master.cars.find((c) => c._id.toString() === car_id);
    if (!car) return res.status(404).json({ message: "Mashina topilmadi" });

    car.sales.push(req.body);
    await master.save();
    return res.json(master);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.createPaymentToMaster = async (req, res) => {
  try {
    const { master_id } = req.params;
    const { car_id, amount, currency, payment_method } = req.body;
    const rateDoc = await Rate.findOne();
    const usdRate = rateDoc?.rate || 1;

    const master = await Master.findById(master_id);
    if (!master) return res.status(404).json({ message: "Usta topilmadi" });

    const car = master.cars.id(car_id);
    if (!car) return res.status(404).json({ message: "Mashina topilmadi" });

    // To‘lovni qo‘shish
    car.payment_log.push({ amount, currency, payment_method });

    // Hisoblash
    const totalSales = car.sales.reduce((sum, sale) => {
      const converted =
        sale.currency === "usd" ? sale.total_price * usdRate : sale.total_price;
      return sum + converted;
    }, 0);

    const totalPayments = car.payment_log.reduce((sum, p) => {
      const converted = p.currency === "usd" ? p.amount * usdRate : p.amount;
      return sum + converted;
    }, 0);

    // To‘lov yetarli bo‘lsa – sotuvlarni Sale collection'ga o‘tkazish
    if (Math.round(totalPayments) >= Math.round(totalSales)) {
      const salesToSave = car.sales.map((sale) => ({
        ...sale.toObject(),
        payment_method: "naqd",
        debtor_name: null,
        debtor_phone: null,
        debt_due_date: null,
      }));

      await Sale.insertMany(salesToSave);
      car.sales = [];
      car.payment_log = [];
    }

    await master.save();
    return res.json({ message: "To‘lov qabul qilindi", master });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.deleteMasterById = async (req, res) => {
  try {
    const { master_id } = req.params;
    await Master.findByIdAndDelete(master_id);
    return res.json({ message: "Usta o'chirildi" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};

exports.deleteCarFromMaster = async (req, res) => {
  try {
    const { master_id, car_id } = req.params;

    const master = await Master.findById(master_id);
    if (!master) {
      return res.status(404).json({ message: "Usta topilmadi" });
    }

    master.cars = master.cars.filter((car) => car._id.toString() !== car_id);
    await master.save();

    return res.json({ message: "Mashina o‘chirildi", master });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Serverda xatolik" });
  }
};
