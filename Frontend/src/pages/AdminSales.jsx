import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import {
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const AdminSales = () => {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  // تعريف API_URL في أعلى الملف
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchSales = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/sales`);
      setSales(data);
      calculateStats(data);
    } catch (error) {
      console.error('خطأ في جلب المبيعات:', error);
    }
  };

  const calculateStats = (salesData) => {
    const today = new Date();
    const todaySales = salesData.filter(sale => 
      new Date(sale.date).toDateString() === today.toDateString()
    );
    
    const weeklySales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= weekAgo;
    });

    const monthlySales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === today.getMonth() && 
             saleDate.getFullYear() === today.getFullYear();
    });

    setStats({
      today: {
        count: todaySales.length,
        total: todaySales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
      },
      weekly: {
        count: weeklySales.length,
        total: weeklySales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
      },
      monthly: {
        count: monthlySales.length,
        total: monthlySales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
      },
      total: {
        count: salesData.length,
        total: salesData.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
      }
    });
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    
    if (filter === 'daily') {
      return saleDate.toDateString() === today.toDateString() &&
        (sale.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         sale.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (filter === 'weekly') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= weekAgo &&
        (sale.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         sale.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (filter === 'monthly') {
      return saleDate.getMonth() === today.getMonth() && 
             saleDate.getFullYear() === today.getFullYear() &&
        (sale.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         sale.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return sale.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sale.username?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getSalesByPeriod = (period) => {
    const today = new Date();
    
    if (period === 'daily') {
      return sales.filter(sale => 
        new Date(sale.date).toDateString() === today.toDateString()
      );
    }
    
    if (period === 'weekly') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sales.filter(sale => new Date(sale.date) >= weekAgo);
    }
    
    if (period === 'monthly') {
      return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === today.getMonth() && 
               saleDate.getFullYear() === today.getFullYear();
      });
    }
    
    return sales;
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        📊 إدارة المبيعات والفواتير - صيدلية اسلام
      </Typography>

      {/* إحصائيات المبيعات */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon />
                <Typography variant="h6">مبيعات اليوم</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.today?.count || 0}
              </Typography>
              <Typography variant="body2">
                إجمالي: {stats.today?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon />
                <Typography variant="h6">مبيعات الأسبوع</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.weekly?.count || 0}
              </Typography>
              <Typography variant="body2">
                إجمالي: {stats.weekly?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">مبيعات الشهر</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.monthly?.count || 0}
              </Typography>
              <Typography variant="body2">
                إجمالي: {stats.monthly?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon />
                <Typography variant="h6">إجمالي المبيعات</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.total?.count || 0}
              </Typography>
              <Typography variant="body2">
                إجمالي: {stats.total?.total || 0} ₪
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
            label="🔍 بحث في المبيعات"
            variant="outlined"
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

      {/* جدول المبيعات */}
      <Paper elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>رقم الفاتورة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>اسم الدواء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الكمية المباعة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>السعر الإجمالي</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>البائع</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>التاريخ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الوقت</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale, index) => (
              <TableRow key={sale._id} hover>
                <TableCell>
                  <Chip 
                    label={`INV-${index + 1}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{sale.medicineName}</Typography>
                </TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="success.main">
                    {sale.totalPrice} ₪
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={sale.username} size="small" color="secondary" />
                </TableCell>
                {/* تم تغيير التواريخ من الهجري إلى الميلادي */}
                <TableCell>{new Date(sale.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleTimeString('en-GB')}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <PrintIcon />
                  </IconButton>
                  <IconButton size="small" color="info">
                    <ReceiptIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredSales.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد مبيعات تطابق البحث' : 'لا توجد مبيعات مسجلة'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminSales;
