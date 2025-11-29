// models/Medicine.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer: String,
  category: String, // الصنف من القوائم التي زودتني بها
  productionDate: Date,
  expiryDate: Date,
  quantity: Number,
  supplierName: String,
  supplierPhone: String,
  salePrice: Number,
  purchasePrice: Number // خاص بالأدمن فقط
});

module.exports = mongoose.model('Medicine', medicineSchema);