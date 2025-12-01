import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Card, CardContent, Grid, Chip, Button, Stack,
  Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

// تعريف API_URL في أعلى الملف
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sales`);
      setSales(response.data);
      calculateStats(response.data);
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

    // إحصائيات البائعين
    const sellerStats = {};
    salesData.forEach(sale => {
      const seller = sale.username || 'غير معروف';
      if (!sellerStats[seller]) {
        sellerStats[seller] = { count: 0, total: 0 };
      }
      sellerStats[seller].count += 1;
      sellerStats[seller].total += sale.totalPrice || 0;
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
      },
      sellers: sellerStats
    });
  };

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

  const topSellers = Object.entries(stats.sellers || {})
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        📈 إدارة المبيعات
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
                {stats.today?.total || 0} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">مبيعات الأسبوع</Typography>
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
                <MoneyIcon />
                <Typography variant="h6">مبيعات الشهر</Typography>
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
                <Typography variant="h6">إجمالي المبيعات</Typography>
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

      <Grid container spacing={3}>
        {/* القسم الأيسر: أفضل البائعين */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🏆 أفضل البائعين
              </Typography>
              
              {topSellers.map(([seller, data], index) => (
                <Stack 
                  key={seller} 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{ p: 1.5, mb: 1, bgcolor: index < 3 ? '#f5f5f5' : 'transparent', borderRadius: 1 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip 
                      label={index + 1} 
                      size="small" 
                      color={index === 0 ? 'primary' : index === 1 ? 'secondary' : index === 2 ? 'success' : 'default'}
                    />
                    <Stack>
                      <Typography variant="body2" fontWeight="bold">
                        {seller}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.count} عملية
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {data.total} ₪
                  </Typography>
                </Stack>
              ))}

              {topSellers.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  لا توجد بيانات عن البائعين
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* القسم الأيمن: إحصائيات سريعة */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📊 إحصائيات سريعة
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {stats.today?.count || 0}
                    </Typography>
                    <Typography variant="body2">مبيعات اليوم</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                    <Typography variant="h4" color="secondary" fontWeight="bold">
                      {stats.weekly?.count || 0}
                    </Typography>
                    <Typography variant="body2">مبيعات الأسبوع</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                    <Typography variant="h4" color="success" fontWeight="bold">
                      {stats.monthly?.count || 0}
                    </Typography>
                    <Typography variant="body2">مبيعات الشهر</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                    <Typography variant="h4" color="warning" fontWeight="bold">
                      {stats.total?.count || 0}
                    </Typography>
                    <Typography variant="body2">إجمالي المبيعات</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* فلترة البحث */}
      <Paper elevation={2} sx={{ p: 2, my: 3 }}>
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
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            placeholder="ابحث باسم الدواء أو البائع..."
          />

          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />}
            onClick={fetchSales}
          >
            تحديث البيانات
          </Button>
        </Stack>
      </Paper>

      {/* جدول المبيعات */}
      <Paper elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>رقم العملية</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>اسم الدواء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الكمية المباعة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المبلغ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>البائع</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>التاريخ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الوقت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale, index) => (
              <TableRow key={sale._id} hover>
                <TableCell>
                  <Chip 
                    label={`#${index + 1}`} 
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
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Chip label={sale.username} size="small" color="secondary" />
                  </Stack>
                </TableCell>
                <TableCell>{new Date(sale.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleTimeString('en-GB')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredSales.length === 0 && (
          <Box textAlign="center" py={4}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد مبيعات تطابق البحث' : 'لا توجد مبيعات مسجلة'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SalesManagement;
