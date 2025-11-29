import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, InputLabel, FormControl,
  Grid, Paper, Stack, Chip, IconButton, Tooltip, Card, CardContent, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

const medicineCategories = [
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

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [form, setForm] = useState({
    name: '', manufacturer: '', category: medicineCategories[0],
    productionDate: '', expiryDate: '',
    quantity: '', supplierName: '', supplierPhone: '', 
    sellingPrice: '', purchasePrice: '',
  });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/medicines');
      setMedicines(response.data);
      setFilteredMedicines(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأدوية:', error);
      setMessage({ type: 'error', text: 'خطأ في جلب البيانات من الخادم' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const filtered = medicines.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered);
  }, [searchTerm, medicines]);

  const handleOpen = (medicine = null) => {
    if (medicine) {
      setForm({
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        productionDate: medicine.productionDate?.split('T')[0] || '',
        expiryDate: medicine.expiryDate?.split('T')[0] || '',
        quantity: medicine.quantity.toString(),
        supplierName: medicine.supplierName,
        supplierPhone: medicine.supplierPhone,
        sellingPrice: medicine.sellingPrice.toString(),
        purchasePrice: medicine.purchasePrice.toString(),
      });
      setEditId(medicine._id);
    } else {
      setForm({
        name: '', manufacturer: '', category: medicineCategories[0],
        productionDate: '', expiryDate: '',
        quantity: '', supplierName: '', supplierPhone: '', 
        sellingPrice: '', purchasePrice: '',
      });
      setEditId(null);
    }
    setOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.quantity || !form.sellingPrice || !form.purchasePrice) {
      setMessage({ type: 'error', text: 'الرجاء ملء جميع الحقول الإلزامية' });
      return;
    }

    if (parseInt(form.quantity) < 0) {
      setMessage({ type: 'error', text: 'الكمية لا يمكن أن تكون سالبة' });
      return;
    }

    const payload = {
      name: form.name,
      manufacturer: form.manufacturer,
      category: form.category,
      productionDate: form.productionDate,
      expiryDate: form.expiryDate,
      quantity: parseInt(form.quantity),
      sellingPrice: parseFloat(form.sellingPrice),
      purchasePrice: parseFloat(form.purchasePrice),
      supplierName: form.supplierName,
      supplierPhone: form.supplierPhone
    };

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      if (editId) {
        await axios.put(`http://localhost:5000/api/medicines/${editId}`, payload);
        setMessage({ type: 'success', text: 'تم تحديث الدواء والمخزون بنجاح' });
      } else {
        await axios.post('http://localhost:5000/api/medicines', payload);
        setMessage({ type: 'success', text: 'تم إضافة الدواء إلى المخزون بنجاح' });
      }
      
      await fetchMedicines();
      
      // إغلاق النافذة بعد نجاح العملية
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('خطأ في حفظ الدواء:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setMessage({ 
        type: 'error', 
        text: `خطأ في حفظ البيانات: ${errorMessage}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, medicineName) => {
    if (window.confirm(`هل تريد حذف الدواء "${medicineName}"؟ سيتم حذفه أيضاً من المخزون.`)) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5000/api/medicines/${id}`);
        await fetchMedicines();
        setMessage({ type: 'success', text: 'تم حذف الدواء من المخزون بنجاح' });
      } catch (error) {
        console.error('خطأ في حذف الدواء:', error);
        setMessage({ type: 'error', text: 'خطأ في حذف الدواء' });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'نفذ', color: 'error' };
    if (quantity <= 10) return { label: 'منخفض', color: 'warning' };
    return { label: 'متوفر', color: 'success' };
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        🏥 إدارة الأدوية والمخزون
      </Typography>

      {/* عرض الرسائل */}
      {message.text && (
        <Alert 
          severity={message.type} 
          onClose={clearMessage}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {/* بطاقة الإحصائيات */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 إحصائيات الأدوية والمخزون
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="h5" fontWeight="bold">{medicines.length}</Typography>
              <Typography variant="body2">إجمالي الأدوية</Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {medicines.filter(m => m.quantity > 10).length}
              </Typography>
              <Typography variant="body2">الأدوية المتوفرة</Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="warning.light">
                {medicines.filter(m => m.quantity <= 10 && m.quantity > 0).length}
              </Typography>
              <Typography variant="body2">الأدوية المنخفضة</Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="error.light">
                {medicines.filter(m => m.quantity === 0).length}
              </Typography>
              <Typography variant="body2">الأدوية النافذة</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* شريط البحث والإجراءات */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="🔍 بحث في الأدوية"
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            placeholder="ابحث باسم الدواء، الشركة المصنعة، أو الصنف..."
          />
          
          <Button 
            variant="outlined" 
            startIcon={<InventoryIcon />}
            onClick={() => setShowList(!showList)}
            color={showList ? "primary" : "inherit"}
            sx={{ minWidth: 150 }}
          >
            {showList ? '👁️ إخفاء القائمة' : '📋 عرض القائمة'}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ minWidth: 140 }}
            color="success"
          >
            ➕ إضافة دواء
          </Button>
        </Stack>
      </Paper>

      {/* جدول الأدوية */}
      {showList && (
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الشركة المصنعة</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الصنف</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الكمية</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>حالة المخزون</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>سعر البيع</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>سعر الشراء</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines.map(med => {
                const status = getStockStatus(med.quantity);
                return (
                  <TableRow key={med._id} hover>
                    <TableCell>
                      <Typography fontWeight="bold">{med.name}</Typography>
                    </TableCell>
                    <TableCell>{med.manufacturer}</TableCell>
                    <TableCell>
                      <Chip label={med.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        fontWeight="bold" 
                        color={med.quantity <= 10 ? 'error' : 'inherit'}
                        variant="h6"
                      >
                        {med.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={status.label} 
                        color={status.color} 
                        size="small" 
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="success.main" variant="h6">
                        {med.sellingPrice} ₪
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary" variant="h6">
                        {med.purchasePrice} ₪
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="تعديل الدواء والمخزون">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpen(med)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف الدواء من المخزون">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(med._id, med.name)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredMedicines.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? '❌ لا توجد أدوية تطابق البحث' : '📝 لا توجد أدوية مضافة'}
              </Typography>
              {!searchTerm && (
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpen()}
                  sx={{ mt: 2 }}
                >
                  إضافة أول دواء
                </Button>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* نافذة إضافة/تعديل الدواء */}
      <Dialog open={open} onClose={!loading ? handleClose : undefined} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: editId ? 'primary.main' : 'success.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {editId ? '✏️ تعديل الدواء والمخزون' : '➕ إضافة دواء جديد إلى المخزون'}
        </DialogTitle>
        
        <DialogContent dividers sx={{ pt: 2 }}>
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="اسم الدواء *" 
                fullWidth 
                margin="normal" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                disabled={loading}
              />
              <TextField 
                label="الشركة المصنعة" 
                fullWidth 
                margin="normal" 
                value={form.manufacturer} 
                onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                disabled={loading}
              />
              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel>الصنف *</InputLabel>
                <Select 
                  value={form.category} 
                  onChange={e => setForm({ ...form, category: e.target.value })} 
                  label="الصنف *"
                >
                  {medicineCategories.map((cat, idx) => (
                    <MenuItem value={cat} key={idx}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="تاريخ الإنتاج"
                type="date"
                fullWidth
                margin="normal"
                value={form.productionDate}
                onChange={e => setForm({ ...form, productionDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="تاريخ الانتهاء"
                type="date"
                fullWidth
                margin="normal"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />

              <TextField 
                label="الكمية *" 
                type="number" 
                fullWidth 
                margin="normal" 
                value={form.quantity} 
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                inputProps={{ min: 0 }}
                disabled={loading}
                helperText="سيتم إضافة هذه الكمية إلى المخزون"
              />
              <TextField 
                label="اسم المورد" 
                fullWidth 
                margin="normal" 
                value={form.supplierName} 
                onChange={e => setForm({ ...form, supplierName: e.target.value })}
                disabled={loading}
              />
              <TextField 
                label="هاتف المورد" 
                fullWidth 
                margin="normal" 
                value={form.supplierPhone} 
                onChange={e => setForm({ ...form, supplierPhone: e.target.value })}
                disabled={loading}
              />
              <TextField 
                label="سعر البيع *" 
                type="number" 
                fullWidth 
                margin="normal" 
                value={form.sellingPrice} 
                onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={loading}
              />
              <TextField 
                label="سعر الشراء *" 
                type="number" 
                fullWidth 
                margin="normal" 
                value={form.purchasePrice} 
                onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={loading}
                helperText="سعر شراء الدواء من المورد"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color={editId ? "primary" : "success"}
            disabled={loading}
            startIcon={loading ? null : (editId ? <EditIcon /> : <AddIcon />)}
          >
            {loading ? '🔄 جاري المعالجة...' : (editId ? 'تحديث الدواء والمخزون' : 'إضافة إلى المخزون')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMedicines;