import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, MenuItem, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

// تعريف API_URL في أعلى الملف
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const categories = [
  'ادوية حساسية',
  'ادوية المعدة والجهاز الهضمي',
  'ادوية السكر',
  'ادوية الضغط',
  'مضادات التهاب',
  'مضادات حيوية',
  'مسكنات الالم',
  'ادوية عشبية/ طبيعية',
  'فيتامينات ومكملات غذائية',
  'ادوية نفسية',
  'ادوية أطفال',
  'ادوية الهرمونات',
  'ادوية القلب',
  'ادوية الاعصاب و النوم',
  'ادوية الجهاز التنفسي',
  'النظافة الشخصية',
  'مستلزمات علاجية',
  'ادوات تجميل'
];

const PharmacistMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    name: '', manufacturer: '', category: '', productionDate: '', expiryDate: '',
    quantity: '', supplierName: '', supplierPhone: '', salePrice: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const { data } = await axios.get(`${API_URL}/api/medicines`);
    setMedicines(data);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/api/medicines/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post(`${API_URL}/api/medicines`, form);
    }
    setForm({ name: '', manufacturer: '', category: '', productionDate: '', expiryDate: '', quantity: '', supplierName: '', supplierPhone: '', salePrice: '' });
    fetchMedicines();
  };

  const handleEdit = med => {
    setForm({
      name: med.name, manufacturer: med.manufacturer, category: med.category,
      productionDate: med.productionDate ? med.productionDate.substring(0, 10) : '',
      expiryDate: med.expiryDate ? med.expiryDate.substring(0, 10) : '',
      quantity: med.quantity, supplierName: med.supplierName,
      supplierPhone: med.supplierPhone, salePrice: med.salePrice
    });
    setEditingId(med._id);
  };

  const handleDelete = async id => {
    await axios.delete(`${API_URL}/api/medicines/${id}`);
    fetchMedicines();
  };

  return (
    <Box p={2}>
      <Typography variant="h6" mb={2}>إدارة الأدوية</Typography>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <TextField label="اسم الدواء" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required sx={{ mr: 1, mb: 1 }} />
        <TextField label="الشركة المصنعة" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} sx={{ mr: 1, mb: 1 }} />

        <TextField select label="الصنف" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required sx={{ mr: 1, mb: 1, minWidth: 200 }}>
          {categories.map((cat, idx) => (
            <MenuItem key={idx} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>

        <TextField label="تاريخ الانتاج" type="date"
          value={form.productionDate} onChange={e => setForm({ ...form, productionDate: e.target.value })} sx={{ mr: 1, mb: 1 }} InputLabelProps={{ shrink: true }} />

        <TextField label="تاريخ الانتهاء" type="date"
          value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} sx={{ mr: 1, mb: 1 }} InputLabelProps={{ shrink: true }} />

        <TextField label="الكمية" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required sx={{ mr: 1, mb: 1 }} />
        <TextField label="اسم المورد" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} sx={{ mr: 1, mb: 1 }} />
        <TextField label="رقم هاتف المورد" value={form.supplierPhone} onChange={e => setForm({ ...form, supplierPhone: e.target.value })} sx={{ mr: 1, mb: 1 }} />
        <TextField label="سعر البيع" type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} required sx={{ mr: 1, mb: 1 }} />

        <Button type="submit" variant="contained" sx={{ mt: 1 }}>{editingId ? 'تحديث' : 'إضافة'}</Button>
      </form>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>الاسم</TableCell>
            <TableCell>الشركة المصنعة</TableCell>
            <TableCell>الصنف</TableCell>
            <TableCell>تاريخ الانتاج</TableCell>
            <TableCell>تاريخ الانتهاء</TableCell>
            <TableCell>الكمية</TableCell>
            <TableCell>اسم المورد</TableCell>
            <TableCell>هاتف المورد</TableCell>
            <TableCell>سعر البيع</TableCell>
            <TableCell>إجراءات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {medicines.map(med => (
            <TableRow key={med._id}>
              <TableCell>{med.name}</TableCell>
              <TableCell>{med.manufacturer}</TableCell>
              <TableCell>{med.category}</TableCell>
              <TableCell>{med.productionDate ? new Date(med.productionDate).toLocaleDateString() : ''}</TableCell>
              <TableCell>{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : ''}</TableCell>
              <TableCell>{med.quantity}</TableCell>
              <TableCell>{med.supplierName}</TableCell>
              <TableCell>{med.supplierPhone}</TableCell>
              <TableCell>{med.salePrice}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(med)} size="small" sx={{ mr: 1 }}>تعديل</Button>
                <Button onClick={() => handleDelete(med._id)} size="small" color="error">حذف</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default PharmacistMedicines;
