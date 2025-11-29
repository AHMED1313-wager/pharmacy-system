require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI and Server PORT config
const mongoURI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!mongoURI) {
  console.error('❌ Error: MONGODB_URI not set in .env file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB connected successfully to database:', mongoose.connection.name);
  console.log('📊 Host:', mongoose.connection.host);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Schemas and Models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true, minlength: 3 },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'pharmacist', 'seller'], required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const medicineSchema = new mongoose.Schema({
  name: String,
  manufacturer: String,
  category: String,
  productionDate: Date,
  expiryDate: Date,
  quantity: Number,
  supplierName: String,
  supplierPhone: String,
  sellingPrice: Number,
  purchasePrice: Number,
});
const Medicine = mongoose.model('Medicine', medicineSchema);

const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date },
  purchasePrice: { type: Number, default: 0 },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Stock = mongoose.model('Stock', stockSchema);

const saleSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String,
  quantity: Number,
  totalPrice: Number,
  username: String,
  date: { type: Date, default: Date.now },
  salePriceAtTime: { type: Number, default: 0 },
  purchasePriceAtTime: { type: Number, default: 0 },
  profitAtTime: { type: Number, default: 0 },
  sellingPricePerUnit: { type: Number, default: 0 }
});
const Sale = mongoose.model('Sale', saleSchema);

// ✅ نموذج المسترجع والتالف
const returnSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String,
  quantity: Number,
  reason: String,
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['return', 'damaged'], required: true },
  purchasePrice: Number,
  sellingPrice: Number
});
const Return = mongoose.model('Return', returnSchema);

const notificationSchema = new mongoose.Schema({
  type: String,
  medicineName: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

const branchSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
});
const Branch = mongoose.model('Branch', branchSchema);

// Password functions
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Seed initial users
async function seedUsers() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const hashedAdminPass = await hashPassword('adminpass');
      const hashedPharmPass = await hashPassword('pharmpass');
      const hashedSellerPass = await hashPassword('sellerpass');
      
      await User.insertMany([
        { username: 'admin001', password: hashedAdminPass, role: 'admin' },
        { username: 'pharm001', password: hashedPharmPass, role: 'pharmacist' },
        { username: 'seller001', password: hashedSellerPass, role: 'seller' }
      ]);
      console.log('✅ Initial users seeded successfully');
    } else {
      console.log(`✅ Database already has ${count} users`);
    }
  } catch (err) {
    console.error('❌ Error seeding users:', err.message);
  }
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    return res.json({ success: true, username: user.username, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// General endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running successfully - صيدلية إسلام',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'Pharmacy Management System - صيدلية إسلام',
    version: '1.0.0',
    database: {
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// User management routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المستخدمين' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await hashPassword(password);
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'تم إضافة المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة المستخدم' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const updateData = { username, role };
    if (password && password.trim() !== '') updateData.password = await hashPassword(password);
    await User.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: 'تم تحديث بيانات المستخدم' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المستخدم' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف المستخدم' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المستخدم' });
  }
});

// Medicines routes
app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find({});
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الأدوية' });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const med = new Medicine(req.body);
    await med.save();

    const stockItem = new Stock({
      name: med.name,
      category: med.category,
      quantity: med.quantity,
      expiryDate: med.expiryDate,
      purchasePrice: med.purchasePrice,
      medicineId: med._id
    });
    await stockItem.save();

    res.status(201).json({ message: 'تم إضافة الدواء والمخزون بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة الدواء' });
  }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const updatedMed = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await Stock.findOneAndUpdate(
      { medicineId: req.params.id },
      {
        name: updatedMed.name,
        category: updatedMed.category,
        quantity: updatedMed.quantity,
        expiryDate: updatedMed.expiryDate,
        purchasePrice: updatedMed.purchasePrice,
        updatedAt: new Date()
      }
    );

    res.json({ message: 'تم تحديث الدواء والمخزون بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الدواء' });
  }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    await Stock.findOneAndDelete({ medicineId: req.params.id });
    res.json({ message: 'تم حذف الدواء من المخزون بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الدواء' });
  }
});

// Stock routes
app.get('/api/stock', async (req, res) => {
  try {
    const stockItems = await Stock.find({});
    res.json(stockItems);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المخزون' });
  }
});

app.post('/api/stock', async (req, res) => {
  try {
    const stockItem = new Stock(req.body);
    await stockItem.save();
    res.status(201).json({ message: 'تم إضافة العنصر إلى المخزون' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة العنصر إلى المخزون' });
  }
});

app.put('/api/stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() });
    res.json({ message: 'تم تحديث العنصر في المخزون' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث العنصر في المخزون' });
  }
});

app.delete('/api/stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف العنصر من المخزون' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف العنصر من المخزون' });
  }
});

// ✅ تحديث قائمة الأصناف
app.get('/api/medicineCategories', (req, res) => {
  const categories = [
    'مسكنات الألم', 'مضادات حيوية', 'مضادات الالتهاب', 'أدوية الضغط',
    'أدوية السكر', 'أدوية المعدة والجهاز الهضمي', 'أدوية الحساسية',
    'أدوية الجهاز التنفسي', 'أدوية الأعصاب والنوم', 'أدوية القلب',
    'أدوية الهرمونات', 'أدوية الأطفال', 'أدوية نفسية',
    'فيتامينات ومكملات غذائية', 'أدوية عشبية / طبيعية',
    'أدوات تجميل', 'مستلزمات علاجية', 'النظافة الشخصية'
  ];
  res.json(categories);
});

// Sales routes
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find({});
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المبيعات' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { items, totalAmount, seller } = req.body;
    
    for (const item of items) {
      const medicine = await Medicine.findOne({ name: item.name });
      if (!medicine) {
        console.log(`⚠️  الدواء غير موجود: ${item.name}`);
        continue;
      }

      const salePricePerUnit = item.sellingPrice || medicine.sellingPrice;
      const purchasePriceAtTime = medicine.purchasePrice;
      const profitAtTime = (salePricePerUnit - purchasePriceAtTime) * item.quantity;

      const sale = new Sale({
        medicineName: item.name,
        medicineId: medicine._id,
        quantity: item.quantity,
        totalPrice: item.totalPrice || (item.quantity * salePricePerUnit),
        username: seller || 'البائع',
        date: new Date(),
        salePriceAtTime: salePricePerUnit,
        purchasePriceAtTime: purchasePriceAtTime,
        profitAtTime: profitAtTime,
        sellingPricePerUnit: salePricePerUnit
      });
      await sale.save();

      medicine.quantity -= item.quantity;
      await medicine.save();

      const stockItem = await Stock.findOne({ name: item.name });
      if (stockItem) {
        stockItem.quantity -= item.quantity;
        await stockItem.save();
      }
    }

    res.status(201).json({ message: 'تمت عملية البيع وتحديث المخزون بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في إضافة المبيع:', error);
    res.status(500).json({ message: 'خطأ في إضافة المبيع' });
  }
});

// ✅ نقاط نهاية المسترجع والتالف
app.get('/api/returns', async (req, res) => {
  try {
    const returns = await Return.find({ type: 'return' });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المسترجع' });
  }
});

app.get('/api/damaged', async (req, res) => {
  try {
    const damaged = await Return.find({ type: 'damaged' });
    res.json(damaged);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب التالف' });
  }
});

app.post('/api/returns', async (req, res) => {
  try {
    const { medicineId, quantity, reason } = req.body;
    const medicine = await Medicine.findById(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }

    const returnItem = new Return({
      medicineId,
      medicineName: medicine.name,
      quantity: parseInt(quantity),
      reason,
      date: new Date(),
      type: 'return',
      purchasePrice: medicine.purchasePrice,
      sellingPrice: medicine.sellingPrice
    });
    await returnItem.save();

    // تحديث المخزون - زيادة الكمية
    medicine.quantity += parseInt(quantity);
    await medicine.save();

    await Stock.findOneAndUpdate(
      { medicineId },
      { $inc: { quantity: parseInt(quantity) }, updatedAt: new Date() }
    );

    res.status(201).json({ message: 'تم إضافة المسترجع وتحديث المخزون بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة المسترجع' });
  }
});

app.post('/api/damaged', async (req, res) => {
  try {
    const { medicineId, quantity, reason } = req.body;
    const medicine = await Medicine.findById(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ message: 'الدواء غير موجود' });
    }

    if (medicine.quantity < quantity) {
      return res.status(400).json({ message: 'الكمية المدخلة أكبر من الكمية المتاحة' });
    }

    const damagedItem = new Return({
      medicineId,
      medicineName: medicine.name,
      quantity: parseInt(quantity),
      reason,
      date: new Date(),
      type: 'damaged',
      purchasePrice: medicine.purchasePrice,
      sellingPrice: medicine.sellingPrice
    });
    await damagedItem.save();

    // تحديث المخزون - تقليل الكمية
    medicine.quantity -= parseInt(quantity);
    await medicine.save();

    await Stock.findOneAndUpdate(
      { medicineId },
      { $inc: { quantity: -parseInt(quantity) }, updatedAt: new Date() }
    );

    res.status(201).json({ message: 'تم إضافة التالف وتحديث المخزون بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة التالف' });
  }
});

// Finance routes
app.get('/api/finance/advanced', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const sales = await Sale.find({});
    const medicines = await Medicine.find({});
    const returns = await Return.find({ type: 'return' });
    const damaged = await Return.find({ type: 'damaged' });

    const analysis = analyzeFinancialDataWithHistoricalPrices(sales, medicines, returns, damaged, period);
    res.json(analysis);
  } catch (error) {
    console.error('❌ خطأ في تحليل البيانات المالية:', error);
    res.status(500).json({ message: 'خطأ في تحليل البيانات المالية' });
  }
});

// دوال مساعدة للتحليل المالي
const analyzeFinancialDataWithHistoricalPrices = (sales, medicines, returns, damaged, period) => {
  const filteredSales = filterSalesByPeriod(sales, period);
  
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
  
  const totalCost = filteredSales.reduce((sum, sale) => {
    const purchasePrice = sale.purchasePriceAtTime > 0 ? 
      sale.purchasePriceAtTime : 
      (medicines.find(m => m.name === sale.medicineName)?.purchasePrice || 0);
    return sum + (sale.quantity * purchasePrice);
  }, 0);

  const returnsValue = returns.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  const damagedValue = damaged.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

  const grossProfit = totalRevenue - totalCost;
  const adjustedProfit = grossProfit + returnsValue - damagedValue;
  const profitMargin = totalRevenue > 0 ? (adjustedProfit / totalRevenue) * 100 : 0;

  const monthlyData = analyzeMonthlySales(sales, medicines);
  const productPerformance = analyzeProductPerformance(filteredSales, medicines);
  const expenses = calculateExpenses(medicines, filteredSales);

  return {
    period: getPeriodLabel(period),
    summary: {
      totalRevenue,
      totalCost,
      grossProfit,
      adjustedProfit,
      profitMargin,
      returnsValue,
      damagedValue,
      netProfit: adjustedProfit - expenses.total,
      totalSales: filteredSales.length,
      averageTransaction: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
    },
    expenses,
    monthlyData,
    productPerformance,
    topProducts: productPerformance.slice(0, 5),
    historicalPricesUsed: filteredSales.some(sale => sale.purchasePriceAtTime > 0)
  };
};

const filterSalesByPeriod = (sales, period) => {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return sales.filter(sale => new Date(sale.date) >= startDate);
};

const analyzeMonthlySales = (sales, medicines) => {
  const monthly = {};
  sales.forEach(sale => {
    const date = new Date(sale.date);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthly[monthYear]) {
      monthly[monthYear] = { revenue: 0, cost: 0, profit: 0 };
    }
    
    monthly[monthYear].revenue += sale.totalPrice || 0;
    
    const purchasePrice = sale.purchasePriceAtTime > 0 ? 
      sale.purchasePriceAtTime : 
      (medicines.find(m => m.name === sale.medicineName)?.purchasePrice || 0);
    
    const cost = sale.quantity * purchasePrice;
    monthly[monthYear].cost += cost;
    monthly[monthYear].profit += (sale.totalPrice || 0) - cost;
  });

  return Object.entries(monthly).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    cost: data.cost,
    profit: data.profit
  })).slice(-12);
};

const analyzeProductPerformance = (sales, medicines) => {
  const products = {};
  
  sales.forEach(sale => {
    if (!products[sale.medicineName]) {
      const medicine = medicines.find(m => m.name === sale.medicineName);
      products[sale.medicineName] = {
        name: sale.medicineName,
        revenue: 0,
        quantity: 0,
        cost: 0,
        purchasePrice: medicine ? medicine.purchasePrice : 0
      };
    }
    
    products[sale.medicineName].revenue += sale.totalPrice || 0;
    products[sale.medicineName].quantity += sale.quantity;
    
    const itemCost = sale.quantity * (sale.purchasePriceAtTime > 0 ? 
      sale.purchasePriceAtTime : products[sale.medicineName].purchasePrice);
    
    products[sale.medicineName].cost += itemCost;
  });

  return Object.values(products)
    .map(product => ({
      ...product,
      profit: product.revenue - product.cost,
      margin: product.revenue > 0 ? ((product.revenue - product.cost) / product.revenue) * 100 : 0
    }))
    .sort((a, b) => b.profit - a.profit);
};

const calculateExpenses = (medicines, sales) => {
  const inventoryCost = medicines.reduce((sum, med) => sum + (med.quantity * med.purchasePrice), 0);
  const operationalExpenses = 0; // ✅ تم إزالة مستلزمات التشغيل
  
  return {
    inventory: inventoryCost,
    operational: operationalExpenses,
    total: operationalExpenses
  };
};

const getPeriodLabel = (period) => {
  const labels = {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    yearly: 'سنوي'
  };
  return labels[period] || period;
};

// Notifications routes
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({});
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب التنبيهات' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف التنبيه' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف التنبيه' });
  }
});

// Branches routes
app.get('/api/branches', async (req, res) => {
  try {
    const branches = await Branch.find({});
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفروع' });
  }
});

app.post('/api/branches', async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json({ message: 'تم إضافة الفرع' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة الفرع' });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  try {
    await Branch.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'تم تحديث الفرع' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الفرع' });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الفرع' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الفرع' });
  }
});

// 404 and general error handling
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Run server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Access the server: http://localhost:${PORT}`);
  console.log(`🏪 System: صيدلية إسلام - Pharmacy Management System`);
  console.log(`💰 Finance API: http://localhost:${PORT}/api/finance/advanced`);
  console.log(`📦 Returns API: http://localhost:${PORT}/api/returns`);

  setTimeout(seedUsers, 1000);
});