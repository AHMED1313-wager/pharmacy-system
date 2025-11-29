import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Card, CardContent, Grid, Chip, Button, Stack,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Calculate as CalculateIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [damaged, setDamaged] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reportDialog, setReportDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [period, searchTerm, inventoryData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medicinesRes, salesRes, returnsRes, damagedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/medicines'),
        axios.get('http://localhost:5000/api/sales'),
        axios.get('http://localhost:5000/api/returns'),
        axios.get('http://localhost:5000/api/damaged')
      ]);
      
      setMedicines(medicinesRes.data);
      setSales(salesRes.data);
      setReturns(returnsRes.data);
      setDamaged(damagedRes.data);
      calculateInventory(medicinesRes.data, salesRes.data, returnsRes.data, damagedRes.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setMessage({ type: 'error', text: 'خطأ في جلب البيانات من الخادم' });
    } finally {
      setLoading(false);
    }
  };

  const calculateInventory = (medicinesData, salesData, returnsData, damagedData) => {
    const today = new Date();
    const inventory = medicinesData.map(medicine => {
      // حساب المبيعات بناءً على الفترة المحددة
      const periodSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date);
        const medicineMatch = sale.medicineName === medicine.name;
        
        if (period === 'daily') {
          return medicineMatch && saleDate.toDateString() === today.toDateString();
        } else if (period === 'weekly') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return medicineMatch && saleDate >= weekAgo;
        } else if (period === 'monthly') {
          return medicineMatch && 
                 saleDate.getMonth() === today.getMonth() && 
                 saleDate.getFullYear() === today.getFullYear();
        } else if (period === 'yearly') {
          return medicineMatch && saleDate.getFullYear() === today.getFullYear();
        }
        return medicineMatch;
      });

      // حساب المسترجع والتالف لنفس الفترة
      const periodReturns = returnsData.filter(item => {
        const itemDate = new Date(item.date);
        const medicineMatch = item.medicineName === medicine.name;
        
        if (period === 'daily') {
          return medicineMatch && itemDate.toDateString() === today.toDateString();
        } else if (period === 'weekly') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return medicineMatch && itemDate >= weekAgo;
        } else if (period === 'monthly') {
          return medicineMatch && 
                 itemDate.getMonth() === today.getMonth() && 
                 itemDate.getFullYear() === today.getFullYear();
        } else if (period === 'yearly') {
          return medicineMatch && itemDate.getFullYear() === today.getFullYear();
        }
        return medicineMatch;
      });

      const periodDamaged = damagedData.filter(item => {
        const itemDate = new Date(item.date);
        const medicineMatch = item.medicineName === medicine.name;
        
        if (period === 'daily') {
          return medicineMatch && itemDate.toDateString() === today.toDateString();
        } else if (period === 'weekly') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return medicineMatch && itemDate >= weekAgo;
        } else if (period === 'monthly') {
          return medicineMatch && 
                 itemDate.getMonth() === today.getMonth() && 
                 itemDate.getFullYear() === today.getFullYear();
        } else if (period === 'yearly') {
          return medicineMatch && itemDate.getFullYear() === today.getFullYear();
        }
        return medicineMatch;
      });

      const totalSold = periodSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const totalReturns = periodReturns.reduce((sum, item) => sum + item.quantity, 0);
      const totalDamaged = periodDamaged.reduce((sum, item) => sum + item.quantity, 0);
      
      const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      
      // ✅ استخدام الأسعار التاريخية من المبيعات لحساب التكلفة
      const totalCost = periodSales.reduce((sum, sale) => {
        const purchasePrice = sale.purchasePriceAtTime > 0 ? 
          sale.purchasePriceAtTime : 
          medicine.purchasePrice;
        
        return sum + (sale.quantity * purchasePrice);
      }, 0);

      // ✅ حساب تأثير المسترجع والتالف على التكلفة
      const returnsCost = periodReturns.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
      const damagedCost = periodDamaged.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

      // ✅ حساب الربح باستخدام الأسعار التاريخية مع مراعاة المسترجع والتالف
      const totalProfit = totalRevenue - totalCost + returnsCost - damagedCost;
      
      // حساب المخزون النظري (الفعلي + المباع - المسترجع + التالف)
      const theoreticalStock = medicine.quantity + totalSold - totalReturns + totalDamaged;
      
      // نسبة البيع إلى المخزون
      const salesRatio = theoreticalStock > 0 ? (totalSold / theoreticalStock) * 100 : 0;

      // ✅ مؤشر استخدام الأسعار التاريخية
      const usesHistoricalPrices = periodSales.some(sale => sale.purchasePriceAtTime > 0);

      return {
        ...medicine,
        totalSold,
        totalReturns,
        totalDamaged,
        totalRevenue,
        totalCost,
        returnsCost,
        damagedCost,
        totalProfit,
        theoreticalStock,
        salesRatio,
        periodSales,
        periodReturns,
        periodDamaged,
        usesHistoricalPrices,
        historicalPricesCount: periodSales.filter(sale => sale.purchasePriceAtTime > 0).length,
        netQuantityChange: totalReturns - totalDamaged // صافي التغير من المسترجع والتالف
      };
    });

    setInventoryData(inventory);
  };

  const filterData = () => {
    let filtered = inventoryData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const generateReport = () => {
    const report = {
      period,
      generatedAt: new Date(),
      totalItems: filteredData.length,
      totalValue: filteredData.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
      totalSold: filteredData.reduce((sum, item) => sum + item.totalSold, 0),
      totalReturns: filteredData.reduce((sum, item) => sum + item.totalReturns, 0),
      totalDamaged: filteredData.reduce((sum, item) => sum + item.totalDamaged, 0),
      totalRevenue: filteredData.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalCost: filteredData.reduce((sum, item) => sum + item.totalCost, 0),
      totalProfit: filteredData.reduce((sum, item) => sum + item.totalProfit, 0),
      lowStockItems: filteredData.filter(item => item.quantity <= 10).length,
      expiredItems: filteredData.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) <= new Date();
      }).length,
      itemsWithHistoricalPrices: filteredData.filter(item => item.usesHistoricalPrices).length,
      items: filteredData
    };

    setCurrentReport(report);
    setReportDialog(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPeriodLabel = () => {
    const labels = {
      daily: 'اليومي',
      weekly: 'الأسبوعي',
      monthly: 'الشهري',
      yearly: 'السنوي'
    };
    return labels[period] || period;
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'نفذ', color: 'error' };
    if (quantity <= 5) return { label: 'منخفض جداً', color: 'error' };
    if (quantity <= 10) return { label: 'منخفض', color: 'warning' };
    return { label: 'جيد', color: 'success' };
  };

  const getSalesPerformance = (ratio) => {
    if (ratio >= 70) return { label: 'ممتاز', color: 'success' };
    if (ratio >= 40) return { label: 'جيد', color: 'warning' };
    return { label: 'منخفض', color: 'error' };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'غير محدد', color: 'default' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry <= 0) return { label: 'منتهي', color: 'error' };
    if (daysToExpiry <= 30) return { label: `ينتهي خلال ${daysToExpiry} يوم`, color: 'warning' };
    return { label: 'ساري', color: 'success' };
  };

  const getHistoricalPriceStatus = (item) => {
    if (item.usesHistoricalPrices) {
      return { label: 'أسعار تاريخية', color: 'success', icon: <HistoryIcon fontSize="small" /> };
    }
    return { label: 'أسعار حالية', color: 'warning', icon: <WarningIcon fontSize="small" /> };
  };

  const getReturnsDamagedStatus = (item) => {
    if (item.netQuantityChange > 0) {
      return { label: `+${item.netQuantityChange}`, color: 'info', tooltip: 'صافي زيادة من المسترجع' };
    } else if (item.netQuantityChange < 0) {
      return { label: `${item.netQuantityChange}`, color: 'error', tooltip: 'صافي نقصان من التالف' };
    }
    return { label: 'متوازن', color: 'default', tooltip: 'لا يوجد تأثير صافي' };
  };

  const InventoryReport = ({ report }) => (
    <Box sx={{ p: 3, border: '2px solid #2e7d32', borderRadius: 2, bgcolor: 'white' }}>
      <Typography variant="h4" align="center" fontWeight="bold" color="#2e7d32" gutterBottom>
        🏪 صيدلية إسلام - تقرير الجرد {getPeriodLabel()}
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography><strong>تاريخ التقرير:</strong> {report.generatedAt.toLocaleString('en-GB')}</Typography>
          <Typography><strong>الفترة:</strong> {getPeriodLabel()}</Typography>
          <Typography><strong>عدد الأصناف:</strong> {report.totalItems}</Typography>
          <Typography><strong>الأصناف باستخدام الأسعار التاريخية:</strong> {report.itemsWithHistoricalPrices}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography><strong>إجمالي القيمة:</strong> {report.totalValue.toFixed(2)} ₪</Typography>
          <Typography><strong>إجمالي المبيعات:</strong> {report.totalSold} وحدة</Typography>
          <Typography><strong>إجمالي المسترجع:</strong> {report.totalReturns} وحدة</Typography>
          <Typography><strong>إجمالي التالف:</strong> {report.totalDamaged} وحدة</Typography>
          <Typography><strong>إجمالي الربح:</strong> {report.totalProfit.toFixed(2)} ₪</Typography>
        </Grid>
      </Grid>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>الدواء</strong></TableCell>
            <TableCell align="center"><strong>المخزون الفعلي</strong></TableCell>
            <TableCell align="center"><strong>المباع ({getPeriodLabel()})</strong></TableCell>
            <TableCell align="center"><strong>المسترجع</strong></TableCell>
            <TableCell align="center"><strong>التالف</strong></TableCell>
            <TableCell align="center"><strong>الإيرادات</strong></TableCell>
            <TableCell align="center"><strong>التكلفة</strong></TableCell>
            <TableCell align="center"><strong>الربح</strong></TableCell>
            <TableCell align="center"><strong>أداء البيع</strong></TableCell>
            <TableCell align="center"><strong>نظام الأسعار</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {report.items.map((item, index) => {
            const stockStatus = getStockStatus(item.quantity);
            const performance = getSalesPerformance(item.salesRatio);
            const priceStatus = getHistoricalPriceStatus(item);
            const returnsDamagedStatus = getReturnsDamagedStatus(item);
            
            return (
              <TableRow key={index}>
                <TableCell>
                  <Typography fontWeight="bold">{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.category}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={item.quantity} color={stockStatus.color} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight="bold">{item.totalSold}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.totalReturns} 
                    color="info" 
                    size="small"
                    variant={item.totalReturns > 0 ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.totalDamaged} 
                    color="error" 
                    size="small"
                    variant={item.totalDamaged > 0 ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight="bold" color="success.main">
                    {item.totalRevenue.toFixed(2)} ₪
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography color="text.secondary">
                    {item.totalCost.toFixed(2)} ₪
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight="bold" color={item.totalProfit >= 0 ? "success.main" : "error"}>
                    {item.totalProfit.toFixed(2)} ₪
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${performance.label} (${item.salesRatio.toFixed(1)}%)`} 
                    color={performance.color} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={priceStatus.label}>
                    <Chip 
                      icon={priceStatus.icon}
                      label={item.historicalPricesCount > 0 ? `${item.historicalPricesCount}` : '0'}
                      color={priceStatus.color} 
                      size="small" 
                      variant="outlined"
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Box sx={{ textAlign: 'center', mt: 3, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="#2e7d32">
          📋 ملخص التقرير - نظام الأسعار التاريخية والمسترجع والتالف
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>إجمالي المبيعات:</strong> {report.totalSold} وحدة
            </Typography>
            <Typography variant="body2">
              <strong>إجمالي الإيرادات:</strong> {report.totalRevenue.toFixed(2)} ₪
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>صافي المسترجع:</strong> +{report.totalReturns} وحدة
            </Typography>
            <Typography variant="body2">
              <strong>صافي التالف:</strong> -{report.totalDamaged} وحدة
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>إجمالي الربح (باستخدام الأسعار التاريخية):</strong> {report.totalProfit.toFixed(2)} ₪
            </Typography>
            <Typography variant="body2">
              <strong>الأصناف باستخدام الأسعار التاريخية:</strong> {report.itemsWithHistoricalPrices}/{report.totalItems}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        📦 نظام الجرد والمخزون - صيدلية إسلام
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InventoryIcon />
                <Typography variant="h6">إجمالي الأصناف</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.length}
              </Typography>
              <Typography variant="body2">صنف دوائي</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">المبيعات ({getPeriodLabel()})</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.reduce((sum, item) => sum + item.totalSold, 0)}
              </Typography>
              <Typography variant="body2">وحدة مباعة</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalculateIcon />
                <Typography variant="h6">الربح ({getPeriodLabel()})</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.reduce((sum, item) => sum + item.totalProfit, 0).toFixed(2)} ₪
              </Typography>
              <Typography variant="body2">باستخدام الأسعار التاريخية</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HistoryIcon />
                <Typography variant="h6">أسعار تاريخية</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.filter(item => item.usesHistoricalPrices).length}
              </Typography>
              <Typography variant="body2">صنف يستخدم الأسعار التاريخية</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* تأثير المسترجع والتالف */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">إجمالي المسترجع</Typography>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.reduce((sum, item) => sum + item.totalReturns, 0)}
              </Typography>
              <Typography variant="body2">وحدة مرتجعة</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">إجمالي التالف</Typography>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.reduce((sum, item) => sum + item.totalDamaged, 0)}
              </Typography>
              <Typography variant="body2">وحدة تالفة</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'grey.600', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">صافي التغير</Typography>
              <Typography variant="h4" fontWeight="bold">
                {filteredData.reduce((sum, item) => sum + item.netQuantityChange, 0)}
              </Typography>
              <Typography variant="body2">من المسترجع والتالف</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* فلترة البحث */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>فترة الجرد</InputLabel>
            <Select
              value={period}
              label="فترة الجرد"
              onChange={(e) => {
                setPeriod(e.target.value);
                setTimeout(() => fetchData(), 100);
              }}
            >
              <MenuItem value="daily">جرد يومي</MenuItem>
              <MenuItem value="weekly">جرد أسبوعي</MenuItem>
              <MenuItem value="monthly">جرد شهري</MenuItem>
              <MenuItem value="yearly">جرد سنوي</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="🔍 بحث في الجرد"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            placeholder="ابحث باسم الدواء، الشركة المصنعة، أو الصنف..."
          />

          <Tooltip title="تحديث البيانات">
            <IconButton onClick={fetchData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button 
            variant="outlined" 
            startIcon={<ReportIcon />}
            onClick={generateReport}
          >
            إنشاء تقرير
          </Button>

          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            color="success"
          >
            طباعة
          </Button>
        </Stack>
      </Paper>

      {/* جدول الجرد */}
      <Paper elevation={3}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الصنف</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">المخزون الفعلي</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">المباع ({getPeriodLabel()})</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">المسترجع</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">التالف</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الإيرادات</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">التكلفة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الربح</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">أداء البيع</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الحالة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الصلاحية</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">نظام الأسعار</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item) => {
              const stockStatus = getStockStatus(item.quantity);
              const performance = getSalesPerformance(item.salesRatio);
              const expiryStatus = getExpiryStatus(item.expiryDate);
              const priceStatus = getHistoricalPriceStatus(item);
              const returnsDamagedStatus = getReturnsDamagedStatus(item);
              
              return (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography fontWeight="bold">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.manufacturer}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      fontWeight="bold" 
                      color={item.quantity <= 10 ? 'error' : 'inherit'}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="secondary.main">
                      {item.totalSold}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="الكمية المرتجعة">
                      <Chip 
                        label={item.totalReturns} 
                        color="info" 
                        size="small"
                        variant={item.totalReturns > 0 ? "filled" : "outlined"}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="الكمية التالفة">
                      <Chip 
                        label={item.totalDamaged} 
                        color="error" 
                        size="small"
                        variant={item.totalDamaged > 0 ? "filled" : "outlined"}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="success.main">
                      {item.totalRevenue.toFixed(2)} ₪
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color="text.secondary">
                      {item.totalCost.toFixed(2)} ₪
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color={item.totalProfit >= 0 ? "success.main" : "error"}>
                      {item.totalProfit.toFixed(2)} ₪
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${item.salesRatio.toFixed(1)}%`} 
                      color={performance.color} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={stockStatus.label} 
                      color={stockStatus.color} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={expiryStatus.label} 
                      color={expiryStatus.color} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={priceStatus.label}>
                      <Chip 
                        icon={priceStatus.icon}
                        label={item.historicalPricesCount > 0 ? `${item.historicalPricesCount}` : '0'}
                        color={priceStatus.color} 
                        size="small" 
                        variant="outlined"
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredData.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <InventoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد عناصر تطابق البحث' : 'لا توجد عناصر في الجرد'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* نافذة التقرير */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: '#2e7d32', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">📊 تقرير الجرد {getPeriodLabel()} - الأسعار التاريخية</Typography>
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
          {currentReport && <InventoryReport report={currentReport} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* معلومات عن نظام الأسعار التاريخية والمسترجع والتالف */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>معلومات عن نظام الأسعار التاريخية والمسترجع والتالف في الجرد:</strong>
        <br />
        • ✅ <strong>الأسعار التاريخية:</strong> تستخدم أسعار الشراء الفعلية وقت البيع
        <br />
        • 📥 <strong>المسترجع:</strong> يزيد المخزون ويحسب كقيمة مضافة في الأرباح
        <br />
        • 🗑️ <strong>التالف:</strong> ينقص المخزون ويحسب كخسارة في الأرباح
        <br />
        • جميع العمليات تؤثر تلقائياً على المخزون والتقارير المالية
      </Alert>
    </Box>
  );
};

export default Inventory;