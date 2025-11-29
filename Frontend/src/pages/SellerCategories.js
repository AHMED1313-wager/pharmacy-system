import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  Stack, TextField, Paper, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import {
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const SellerCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchMedicines();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicineCategories');
      setCategories(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأصناف:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/medicines');
      const availableMedicines = response.data.filter(med => med.quantity > 0);
      setMedicines(availableMedicines);
    } catch (error) {
      console.error('خطأ في جلب الأدوية:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesCategory = !selectedCategory || med.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (medicine) => {
    const existingItem = cart.find(item => item._id === medicine._id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > medicine.quantity) {
        setMessage({ type: 'warning', text: `الكمية المتاحة: ${medicine.quantity} فقط` });
        return;
      }
      const updatedCart = cart.map(item =>
        item._id === medicine._id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.sellingPrice }
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        ...medicine,
        quantity: 1,
        totalPrice: medicine.sellingPrice
      }]);
    }
    setMessage({ type: 'success', text: `تم إضافة ${medicine.name} إلى السلة` });
  };

  const removeFromCart = (id) => {
    const updatedCart = cart.filter(item => item._id !== id);
    setCart(updatedCart);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSell = async () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'السلة فارغة' });
      return;
    }

    try {
      setLoading(true);
      const invoiceData = {
        items: cart,
        totalAmount,
        seller: user?.username || 'البائع',
        date: new Date().toISOString(),
        pharmacyName: 'صيدلية النور'
      };

      const response = await axios.post('http://localhost:5000/api/sales', invoiceData);

      // ✅ تصحيح: تحديث المخزون بشكل صحيح - طرح الكمية المباعة فقط
      for (const item of cart) {
        const medicine = medicines.find(m => m._id === item._id);
        if (medicine) {
          const newQuantity = medicine.quantity - item.quantity;
          await axios.put(`http://localhost:5000/api/medicines/${item._id}`, {
            quantity: newQuantity
          });
        }
      }

      setCurrentInvoice({
        ...invoiceData,
        invoiceNumber: `INV-${Date.now()}`,
        id: response.data._id
      });
      setInvoiceDialog(true);
      
      setMessage({ type: 'success', text: 'تمت عملية البيع بنجاح' });
      setCart([]);
      await fetchMedicines();
    } catch (error) {
      console.error('خطأ في عملية البيع:', error);
      setMessage({ type: 'error', text: 'خطأ في عملية البيع' });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const PharmacyInvoice = ({ invoice }) => (
    <Box sx={{ p: 3, border: '2px solid #2e7d32', borderRadius: 2, bgcolor: 'white' }}>
      <Typography variant="h4" align="center" fontWeight="bold" color="#2e7d32" gutterBottom>
        🏪 صيدلية النور
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Typography><strong>رقم الفاتورة:</strong> {invoice.invoiceNumber}</Typography>
          <Typography><strong>التاريخ:</strong> {new Date(invoice.date).toLocaleString('ar-SA')}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography><strong>البائع:</strong> {invoice.seller}</Typography>
          <Typography><strong>الوقت:</strong> {new Date(invoice.date).toLocaleTimeString('ar-SA')}</Typography>
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>الدواء</strong></TableCell>
            <TableCell align="center"><strong>الكمية</strong></TableCell>
            <TableCell align="center"><strong>السعر</strong></TableCell>
            <TableCell align="center"><strong>المجموع</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.name}</TableCell>
              <TableCell align="center">{item.quantity}</TableCell>
              <TableCell align="center">{item.sellingPrice} ₪</TableCell>
              <TableCell align="center">{item.totalPrice} ₪</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold" color="#2e7d32">
          الإجمالي: {invoice.totalAmount} ₪
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          شكراً لشرائكم من صيدلية النور
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="#2e7d32">
        🗂️ الأدوية حسب التصنيف
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* القسم الأيسر: التصنيفات والأدوية */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="#2e7d32" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon /> التصنيفات
              </Typography>
              
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                <Chip
                  label="جميع التصنيفات"
                  clickable
                  color={!selectedCategory ? "primary" : "default"}
                  onClick={() => setSelectedCategory('')}
                />
                {categories.map(category => (
                  <Chip
                    key={category}
                    label={category}
                    clickable
                    color={selectedCategory === category ? "primary" : "default"}
                    onClick={() => setSelectedCategory(category)}
                  />
                ))}
              </Stack>

              <TextField
                label="🔍 بحث في الأدوية"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                {selectedCategory ? `الأدوية في ${selectedCategory}` : 'جميع الأدوية'} 
                ({filteredMedicines.length})
              </Typography>
            </CardContent>
          </Card>

          {/* قائمة الأدوية */}
          <Grid container spacing={2}>
            {filteredMedicines.map(medicine => (
              <Grid item xs={12} sm={6} md={4} key={medicine._id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: '#2e7d32'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {medicine.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {medicine.manufacturer}
                    </Typography>

                    <Chip 
                      label={medicine.category} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mb: 1 }}
                    />

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        الكمية: <strong>{medicine.quantity}</strong>
                      </Typography>
                      <Typography variant="h6" color="#2e7d32">
                        {medicine.sellingPrice} ₪
                      </Typography>
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => addToCart(medicine)}
                      disabled={medicine.quantity === 0}
                      sx={{ 
                        bgcolor: '#2e7d32', 
                        '&:hover': { bgcolor: '#1b5e20' },
                        '&:disabled': { bgcolor: 'grey.400' }
                      }}
                    >
                      {medicine.quantity === 0 ? 'غير متوفر' : 'إضافة للسلة'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredMedicines.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {selectedCategory ? `لا توجد أدوية في ${selectedCategory}` : 'لا توجد أدوية متاحة'}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* القسم الأيمن: السلة */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="h6">سلة المشتريات</Typography>
                <Chip label={cart.length} color="primary" size="small" />
              </Stack>

              {cart.length > 0 ? (
                <>
                  <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                    {cart.map(item => (
                      <Paper key={item._id} sx={{ p: 1.5, mb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.quantity} × {item.sellingPrice} ₪
                            </Typography>
                          </Box>
                          <Stack alignItems="end" spacing={0.5}>
                            <Typography fontWeight="bold" color="#2e7d32">
                              {item.totalPrice} ₪
                            </Typography>
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => removeFromCart(item._id)}
                            >
                              حذف
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#e8f5e8', borderRadius: 1, mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6">الإجمالي:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="#2e7d32">
                        {totalAmount} ₪
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="outlined" 
                      onClick={clearCart}
                      fullWidth
                    >
                      مسح السلة
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ReceiptIcon />}
                      onClick={handleSell}
                      disabled={loading}
                      sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                      {loading ? 'جاري المعالجة...' : 'إنهاء البيع'}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Box textAlign="center" py={4}>
                  <ShoppingCartIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    السلة فارغة
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    اختر أدوية من القائمة
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* نافذة الفاتورة */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: '#2e7d32', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">🧾 فاتورة البيع</Typography>
          <Button 
            startIcon={<PrintIcon />} 
            variant="contained" 
            sx={{ bgcolor: 'white', color: '#2e7d32', '&:hover': { bgcolor: '#f5f5f5' } }}
            onClick={handlePrintInvoice}
          >
            طباعة
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {currentInvoice && <PharmacyInvoice invoice={currentInvoice} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerCategories;