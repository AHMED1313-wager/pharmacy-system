import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, TextField, Button, Card, CardContent, Grid,
  Chip, Stack, Paper, Alert, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalPharmacy as PharmacyIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const SellerSearch = () => {
  const { user } = useContext(AuthContext);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
    } else {
      const results = medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    }
  }, [searchTerm, medicines]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/medicines');
      const availableMedicines = response.data.filter(med => med.quantity > 0);
      setMedicines(availableMedicines);
    } catch (error) {
      console.error('خطأ في جلب الأدوية:', error);
      setMessage({ type: 'error', text: 'خطأ في جلب البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

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

  const getStockStatus = (quantity) => {
    if (quantity <= 5) return { label: 'منخفض', color: 'error' };
    if (quantity <= 10) return { label: 'متوسط', color: 'warning' };
    return { label: 'جيد', color: 'success' };
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
        🔍 البحث في الأدوية
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* القسم الأيسر: البحث والنتائج */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="#2e7d32">
                ابحث عن الأدوية
              </Typography>
              
              <TextField
                fullWidth
                placeholder="ابحث باسم الدواء، الشركة المصنعة، أو التصنيف..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {searchTerm && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  نتائج البحث عن: "{searchTerm}" ({searchResults.length} نتيجة)
                </Typography>
              )}

              {searchResults.length > 0 ? (
                <Grid container spacing={2}>
                  {searchResults.map(medicine => {
                    const status = getStockStatus(medicine.quantity);
                    const inCart = cart.find(item => item._id === medicine._id);
                    
                    return (
                      <Grid item xs={12} key={medicine._id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Grid container alignItems="center" spacing={2}>
                              <Grid item>
                                <PharmacyIcon color="primary" sx={{ fontSize: 40 }} />
                              </Grid>
                              
                              <Grid item xs>
                                <Typography variant="h6" gutterBottom>
                                  {medicine.name}
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    {medicine.manufacturer}
                                  </Typography>
                                  <Chip label={medicine.category} size="small" variant="outlined" />
                                  <Chip 
                                    label={status.label} 
                                    color={status.color} 
                                    size="small" 
                                  />
                                </Stack>
                              </Grid>

                              <Grid item>
                                <Stack spacing={1} alignItems="end">
                                  <Typography variant="h6" color="#2e7d32">
                                    {medicine.sellingPrice} ₪
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    متوفر: {medicine.quantity}
                                  </Typography>
                                  {inCart ? (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Typography variant="body2" color="primary">
                                        {inCart.quantity} في السلة
                                      </Typography>
                                      <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => removeFromCart(medicine._id)}
                                      >
                                        إزالة
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<ShoppingCartIcon />}
                                      onClick={() => addToCart(medicine)}
                                      sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                                    >
                                      إضافة
                                    </Button>
                                  )}
                                </Stack>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : searchTerm ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    لا توجد نتائج لـ "{searchTerm}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    حاول البحث باستخدام مصطلحات أخرى
                  </Typography>
                </Paper>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    ابحث عن الأدوية المتاحة
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    اكتب اسم الدواء، الشركة المصنعة، أو التصنيف في حقل البحث
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
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
                    ابحث عن أدوية وأضفها إلى السلة
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

export default SellerSearch;