import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Card, CardContent, Grid, Chip, Button, Stack,
  Select, MenuItem, FormControl, InputLabel, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';

const SellerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sales');
      setInvoices(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('خطأ في جلب الفواتير:', error);
    }
  };

  const calculateStats = (invoicesData) => {
    const today = new Date();
    
    const todayInvoices = invoicesData.filter(invoice => 
      new Date(invoice.date).toDateString() === today.toDateString()
    );
    
    const weeklyInvoices = invoicesData.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return invoiceDate >= weekAgo;
    });

    const monthlyInvoices = invoicesData.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === today.getMonth() && 
             invoiceDate.getFullYear() === today.getFullYear();
    });

    setStats({
      today: {
        count: todayInvoices.length,
        total: todayInvoices.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0)
      },
      weekly: {
        count: weeklyInvoices.length,
        total: weeklyInvoices.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0)
      },
      monthly: {
        count: monthlyInvoices.length,
        total: monthlyInvoices.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0)
      },
      total: {
        count: invoicesData.length,
        total: invoicesData.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0)
      }
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const today = new Date();
    
    if (filter === 'daily') {
      return invoiceDate.toDateString() === today.toDateString();
    }
    
    if (filter === 'weekly') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return invoiceDate >= weekAgo;
    }
    
    if (filter === 'monthly') {
      return invoiceDate.getMonth() === today.getMonth() && 
             invoiceDate.getFullYear() === today.getFullYear();
    }
    
    return true;
  }).filter(invoice =>
    invoice.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialog(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTotalSales = () => {
    return filteredInvoices.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0);
  };

  const PharmacyInvoice = ({ invoice }) => (
    <Box sx={{ p: 3, border: '2px solid #2e7d32', borderRadius: 2, bgcolor: 'white' }}>
      {/* تم تغيير اسم الصيدلية إلى صيدلية اسلام */}
      <Typography variant="h4" align="center" fontWeight="bold" color="#2e7d32" gutterBottom>
        🏪 صيدلية اسلام
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Typography><strong>رقم الفاتورة:</strong> INV-{invoice._id?.slice(-6)}</Typography>
          {/* تم تغيير التاريخ إلى الميلادي */}
          <Typography><strong>التاريخ:</strong> {new Date(invoice.date).toLocaleDateString('en-GB')}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography><strong>البائع:</strong> {invoice.username}</Typography>
          <Typography><strong>الوقت:</strong> {new Date(invoice.date).toLocaleTimeString('en-GB')}</Typography>
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
          <TableRow>
            <TableCell>{invoice.medicineName}</TableCell>
            <TableCell align="center">{invoice.quantity}</TableCell>
            <TableCell align="center">{invoice.totalPrice / invoice.quantity} ₪</TableCell>
            <TableCell align="center">{invoice.totalPrice} ₪</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
        <Typography variant="h5" fontWeight="bold" color="#2e7d32">
          الإجمالي: {invoice.totalPrice} ₪
        </Typography>
        {/* تم تغيير اسم الصيدلية في الرسالة */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          شكراً لشرائكم من صيدلية اسلام
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        🧾 قائمة الفواتير - صيدلية اسلام
      </Typography>

      {/* إحصائيات */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon />
                <Typography variant="h6">فواتير اليوم</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.today?.count || 0}
              </Typography>
              <Typography variant="body2">
                {stats.today?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon />
                <Typography variant="h6">فواتير الأسبوع</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.weekly?.count || 0}
              </Typography>
              <Typography variant="body2">
                {stats.weekly?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">فواتير الشهر</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.monthly?.count || 0}
              </Typography>
              <Typography variant="body2">
                {stats.monthly?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon />
                <Typography variant="h6">إجمالي الفواتير</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.total?.count || 0}
              </Typography>
              <Typography variant="body2">
                {stats.total?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* فلترة البحث */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>فترة العرض</InputLabel>
            <Select
              value={filter}
              label="فترة العرض"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="daily">اليومي</MenuItem>
              <MenuItem value="weekly">الأسبوعي</MenuItem>
              <MenuItem value="monthly">الشهري</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="🔍 بحث في الفواتير"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            placeholder="ابحث باسم الدواء أو البائع..."
          />

          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            طباعة التقرير
          </Button>
        </Stack>
      </Paper>

      {/* جدول الفواتير */}
      <Paper elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>رقم الفاتورة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>اسم الدواء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الكمية</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المبلغ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>البائع</TableCell>
              {/* تم تغيير العناوين للتأكيد على الميلادي */}
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>التاريخ (ميلادي)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الوقت</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((invoice, index) => (
              <TableRow key={invoice._id} hover>
                <TableCell>
                  <Chip 
                    label={`INV-${index + 1}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{invoice.medicineName}</Typography>
                </TableCell>
                <TableCell>{invoice.quantity}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="success.main">
                    {invoice.totalPrice} ₪
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={invoice.username} size="small" color="secondary" />
                </TableCell>
                {/* تم تغيير التواريخ من الهجري إلى الميلادي */}
                <TableCell>{new Date(invoice.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{new Date(invoice.date).toLocaleTimeString('en-GB')}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<ReceiptIcon />}
                    onClick={() => viewInvoice(invoice)}
                  >
                    عرض
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredInvoices.length === 0 && (
          <Box textAlign="center" py={4}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد فواتير تطابق البحث' : 'لا توجد فواتير مسجلة'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* نافذة عرض الفاتورة */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: '#2e7d32', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">🧾 تفاصيل الفاتورة - صيدلية اسلام</Typography>
          <Button 
            startIcon={<PrintIcon />} 
            variant="contained" 
            sx={{ bgcolor: 'white', color: '#2e7d32' }}
            onClick={handlePrint}
          >
            طباعة
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedInvoice && <PharmacyInvoice invoice={selectedInvoice} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerInvoices;