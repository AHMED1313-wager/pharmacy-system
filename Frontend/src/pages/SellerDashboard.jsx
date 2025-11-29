import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, TextField, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  LocalOffer as LocalOfferIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const SellerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [medicines, setMedicines] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const lowStock = medicines.filter(med => med.quantity > 0 && med.quantity <= 10);
    setLowStockMedicines(lowStock);
  }, [medicines]);

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

  const addToCart = (medicine) => {
    const existingItem = cart.find(item => item._id === medicine._id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > medicine.quantity) {
        setMessage({ type: 'warning', text: `الكمية المتاحة: ${medicine.quantity} فقط` });
        return;
      }
      const updatedCart = cart.map(item =>
        item._id === medicine._id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              totalPrice: (item.quantity + 1) * item.sellingPrice,
              // ✅ التأكد من إرسال sellingPrice مع البيانات
              sellingPrice: item.sellingPrice
            }
          : item
      );
      setCart(updatedCart);
    } else {
      if (medicine.quantity < 1) {
        setMessage({ type: 'warning', text: 'الدواء غير متوفر' });
        return;
      }
      setCart([...cart, {
        ...medicine,
        quantity: 1,
        totalPrice: medicine.sellingPrice,
        // ✅ إضافة sellingPrice بشكل صريح
        sellingPrice: medicine.sellingPrice
      }]);
    }
    setMessage({ type: 'success', text: `تم إضافة ${medicine.name} إلى السلة` });
  };

  const updateCartQuantity = (id, newQuantity) => {
    const medicine = medicines.find(m => m._id === id);
    if (newQuantity > medicine.quantity) {
      setMessage({ type: 'warning', text: `الكمية المتاحة: ${medicine.quantity} فقط` });
      return;
    }

    const updatedCart = cart.map(item =>
      item._id === id 
        ? { 
            ...item, 
            quantity: newQuantity, 
            totalPrice: newQuantity * item.sellingPrice 
          }
        : item
    ).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
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
      
      // ✅ التأكد من أن كل عنصر يحتوي على sellingPrice
      const cartWithPrices = cart.map(item => ({
        ...item,
        sellingPrice: item.sellingPrice || item.salePrice || 0 // استخدام سعر البيع
      }));

      const invoiceData = {
        items: cartWithPrices,
        totalAmount,
        seller: user?.username || 'البائع',
        date: new Date().toISOString(),
        pharmacyName: 'صيدلية النور'
      };

      const response = await axios.post('http://localhost:5000/api/sales', invoiceData);

      // ✅ تحديث المخزون بشكل صحيح
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
      
      setMessage({ type: 'success', text: 'تمت عملية البيع بنجاح - تم حفظ الأسعار التاريخية ✅' });
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

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'نفذ', color: 'error' };
    if (quantity <= 5) return { label: 'منخفض جداً', color: 'error' };
    if (quantity <= 10) return { label: 'منخفض', color: 'warning' };
    return { label: 'متوفر', color: 'success' };
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
        <Typography variant="caption" color="text.secondary">
          ✅ تم حفظ الأسعار التاريخية للتقرير المالي
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        🏠 لوحة تحكم البائع - نظام الأسعار التاريخية
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* الإحصائيات */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalOfferIcon />
                <Typography variant="h6">الأدوية المتاحة</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {medicines.length}
              </Typography>
              <Typography variant="body2">
                صنف دواء مختلف
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">المبيعات اليوم</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                0
              </Typography>
              <Typography variant="body2">
                عملية بيع
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon />
                <Typography variant="h6">منخفضة المخزون</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {lowStockMedicines.length}
              </Typography>
              <Typography variant="body2">
                تحتاج إعادة تخزين
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HistoryIcon />
                <Typography variant="h6">نظام الأسعار</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                ✅
              </Typography>
              <Typography variant="body2">
                الأسعار التاريخية مفعلة
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* القسم الأيسر: البيع السريع والتحذيرات */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* البيع السريع */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    ⚡ بيع سريع - نظام الأسعار التاريخية
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="ابحث عن دواء للبيع السريع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  {searchTerm && (
                    <TableContainer component={Paper} elevation={1}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>الدواء</TableCell>
                            <TableCell>المخزون</TableCell>
                            <TableCell>السعر</TableCell>
                            <TableCell>الإجراء</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMedicines.map(medicine => {
                            const status = getStockStatus(medicine.quantity);
                            const inCart = cart.find(item => item._id === medicine._id);
                            
                            return (
                              <TableRow key={medicine._id} hover>
                                <TableCell>
                                  <Typography fontWeight="bold">{medicine.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {medicine.manufacturer}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={medicine.quantity} 
                                    color={status.color} 
                                    size="small" 
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography fontWeight="bold" color="success.main">
                                    {medicine.sellingPrice} ₪
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {inCart ? (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <IconButton 
                                        size="small"
                                        onClick={() => updateCartQuantity(medicine._id, inCart.quantity - 1)}
                                      >
                                        <RemoveIcon fontSize="small" />
                                      </IconButton>
                                      <Typography>{inCart.quantity}</Typography>
                                      <IconButton 
                                        size="small"
                                        onClick={() => updateCartQuantity(medicine._id, inCart.quantity + 1)}
                                      >
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  ) : (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => addToCart(medicine)}
                                      disabled={medicine.quantity === 0}
                                    >
                                      إضافة
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* تحذيرات المخزون المنخفض */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6" color="warning.main">
                      تحذيرات المخزون المنخفض
                    </Typography>
                  </Stack>

                  {lowStockMedicines.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>الدواء</TableCell>
                            <TableCell>المخزون الحالي</TableCell>
                            <TableCell>سعر البيع</TableCell>
                            <TableCell>الحالة</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowStockMedicines.map(medicine => {
                            const status = getStockStatus(medicine.quantity);
                            return (
                              <TableRow key={medicine._id} hover>
                                <TableCell>
                                  <Typography fontWeight="bold">{medicine.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {medicine.manufacturer}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography 
                                    fontWeight="bold" 
                                    color={medicine.quantity <= 5 ? 'error' : 'warning.main'}
                                  >
                                    {medicine.quantity}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography fontWeight="bold" color="success.main">
                                    {medicine.sellingPrice} ₪
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={status.label} 
                                    color={status.color} 
                                    size="small" 
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      🎉 لا توجد تحذيرات - جميع الأدوية بمستويات جيدة
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* القسم الأيمن: سلة المشتريات */}
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
                  <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
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
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => removeFromCart(item._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      ✅ سيتم حفظ الأسعار التاريخية تلقائياً
                    </Typography>
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
          <Typography variant="h6">🧾 فاتورة البيع - نظام الأسعار التاريخية</Typography>
          <Button 
            startIcon={<PrintIcon />} 
            variant="contained" 
            sx={{ bgcolor: 'white', color: '#2e7d32', '&:hover': { bgcolor: '#f5f5f5' } }}
            onClick={() => window.print()}
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

      {/* معلومات عن نظام الأسعار التاريخية */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>معلومات عن نظام الأسعار التاريخية:</strong>
        <br />
        • ✅ <strong>المبيعات الجديدة:</strong> سيتم حفظ سعر البيع والشراء الفعلي وقت العملية
        <br />
        • 📊 <strong>التقارير المالية:</strong> ستظهر أرباح دقيقة بناءً على الأسعار الفعلية وقت البيع
        <br />
        • 🔒 <strong>حماية البيانات:</strong> تغيير الأسعار المستقبلي لا يؤثر على التقارير التاريخية
      </Alert>
    </Box>
  );
};

export default SellerDashboard;