import React, { useState } from 'react';

const medicineCategories = [
  'مسكنات الألم',
  'مضادات حيوية',
  'مضادات الالتهاب',
  'أدوية الضغط',
  'أدوية السكر',
  'أدوية المعدة والجهاز الهضمي',
  'أدوية الحساسية',
  'أدوية الجهاز التنفسي',
  'أدوية الأعصاب والنوم',
  'أدوية القلب',
  'أدوية الهرمونات',
  'أدوية الأطفال',
  'أدوية نفسية',
  'فيتامينات ومكملات غذائية',
  'أدوية عشبية / طبيعية',
  'المستلزمات الطبية',
  'العناية الشخصية',
  'مستحضرات التجميل',
  'منتجات الأطفال',
  'التغذية والمكملات',
  'منتجات نسائية ورجالية خاصة'
];

const PharmacistDashboard = () => {
  const [form, setForm] = useState({
    medicineName: '',
    manufacturer: '',
    category: '',
    productionDate: '',
    expiryDate: '',
    quantity: '',
    supplierName: '',
    supplierPhone: '',
    salePrice: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // هنا من المفروض يتصل بالباك إند أو يخزن البيانات
    alert(`تم إضافة الدواء: ${form.medicineName}`);
    setForm({
      medicineName: '',
      manufacturer: '',
      category: '',
      productionDate: '',
      expiryDate: '',
      quantity: '',
      supplierName: '',
      supplierPhone: '',
      salePrice: ''
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>إدارة الأدوية</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <input
          name="medicineName"
          type="text"
          placeholder="اسم الدواء"
          value={form.medicineName}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="manufacturer"
          type="text"
          placeholder="الشركة المصنعة"
          value={form.manufacturer}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        >
          <option value="">اختر الصنف</option>
          {medicineCategories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          name="productionDate"
          type="date"
          value={form.productionDate}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="expiryDate"
          type="date"
          value={form.expiryDate}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="quantity"
          type="number"
          placeholder="الكمية"
          value={form.quantity}
          onChange={handleChange}
          min="1"
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="supplierName"
          type="text"
          placeholder="اسم المورد"
          value={form.supplierName}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="supplierPhone"
          type="tel"
          placeholder="رقم هاتف المورد"
          value={form.supplierPhone}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="salePrice"
          type="number"
          placeholder="سعر البيع"
          value={form.salePrice}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: 10, width: '100%', backgroundColor: '#007bff', color: '#fff', border: 'none' }}>
          إضافة دواء
        </button>
      </form>
    </div>
  );
};

export default PharmacistDashboard;