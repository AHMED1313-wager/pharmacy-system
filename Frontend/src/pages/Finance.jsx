import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  TableContainer,
  Chip,
  TextField  // ⬅️ تم إضافة هذا
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Finance = () => {
  const [period, setPeriod] = useState('monthly');
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const periods = [
    { value: 'daily', label: 'يومي', days: 1 },
    { value: 'weekly', label: 'أسبوعي', days: 7 },
    { value: 'monthly', label: 'شهري', days: 30 },
    { value: 'yearly', label: 'سنوي', days: 365 },
    { value: 'custom', label: 'مخصص', days: null }
  ];

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/finance/advanced?period=${period}`);
      setFinanceData(response.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات المالية:', error);
      await fetchLocalData();
    }
    setLoading(false);
  };

  const fetchLocalData = async () => {
    try {
      const [salesRes, medicinesRes, returnsRes, damagedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sales'),
        axios.get('http://localhost:5000/api/medicines'),
        axios.get('http://localhost:5000/api/returns'),
        axios.get('http://localhost:5000/api/damaged')
      ]);

      const salesData = salesRes.data;
      const medicinesData = medicinesRes.data;
      const returnsData = returnsRes.data;
      const damagedData = damagedRes.data;

      const analyzedData = analyzeFinancialData(salesData, medicinesData, returnsData, damagedData, period, dateRange);
      setFinanceData(analyzedData);
    } catch (error) {
      console.error('خطأ في جلب البيانات المحلية:', error);
      setFinanceData(generateMockData());
    }
  };

  const analyzeFinancialData = (sales, medicines, returns, damaged, period, range) => {
    const filteredSales = filterSalesByPeriod(sales, period, range);
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    
    const totalCost = filteredSales.reduce((sum, sale) => {
      const purchasePrice = sale.purchasePriceAtTime > 0 ? 
        sale.purchasePriceAtTime : 
        (medicines.find(m => m._id === sale.medicineId || m.name === sale.medicineName)?.purchasePrice || 0);
      
      return sum + (sale.quantity * purchasePrice);
    }, 0);

    // ✅ حساب تأثير المسترجع والتالف على الأرباح
    const returnsValue = returns.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    const damagedValue = damaged.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

    const grossProfit = totalRevenue - totalCost;
    const adjustedProfit = grossProfit + returnsValue - damagedValue;
    const profitMargin = totalRevenue > 0 ? (adjustedProfit / totalRevenue) * 100 : 0;

    const monthlyData = analyzeMonthlySales(sales, medicines);
    const productPerformance = analyzeProductPerformance(filteredSales, medicines);
    const expenses = calculateExpenses(medicines, filteredSales);

    return {
      period: periods.find(p => p.value === period)?.label || period,
      dateRange,
      summary: {
        totalRevenue,
        totalCost,
        grossProfit,
        adjustedProfit,
        profitMargin,
        returnsValue,
        damagedValue,
        netProfit: adjustedProfit - expenses.total,
        totalSales: filteredSales.length,
        averageTransaction: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
      },
      expenses,
      monthlyData,
      productPerformance,
      topProducts: productPerformance.slice(0, 5),
      historicalPricesUsed: filteredSales.some(sale => sale.purchasePriceAtTime > 0),
      rawData: {
        sales: filteredSales,
        medicines,
        returns,
        damaged
      }
    };
  };

  const filterSalesByPeriod = (sales, period, range) => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        startDate = new Date(range.start);
        const endDate = new Date(range.end);
        return sales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= startDate && saleDate <= endDate;
        });
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return sales.filter(sale => new Date(sale.date) >= startDate);
  };

  const analyzeMonthlySales = (sales, medicines) => {
    const monthly = {};
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthly[monthYear]) {
        monthly[monthYear] = { revenue: 0, cost: 0, profit: 0 };
      }
      
      monthly[monthYear].revenue += sale.totalPrice || 0;
      
      const purchasePrice = sale.purchasePriceAtTime > 0 ? 
        sale.purchasePriceAtTime : 
        (medicines.find(m => m._id === sale.medicineId || m.name === sale.medicineName)?.purchasePrice || 0);
      
      const cost = sale.quantity * purchasePrice;
      monthly[monthYear].cost += cost;
      monthly[monthYear].profit += (sale.totalPrice || 0) - cost;
    });

    return Object.entries(monthly).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit
    })).slice(-12);
  };

  const analyzeProductPerformance = (sales, medicines) => {
    const products = {};
    
    sales.forEach(sale => {
      if (!products[sale.medicineName]) {
        const medicine = medicines.find(m => m._id === sale.medicineId || m.name === sale.medicineName);
        products[sale.medicineName] = {
          name: sale.medicineName,
          revenue: 0,
          quantity: 0,
          cost: 0,
          purchasePrice: sale.purchasePriceAtTime > 0 ? sale.purchasePriceAtTime : (medicine ? medicine.purchasePrice : 0),
          currentSalePrice: medicine ? medicine.sellingPrice : 0,
          currentPurchasePrice: medicine ? medicine.purchasePrice : 0,
          usesHistoricalPrice: sale.purchasePriceAtTime > 0
        };
      }
      
      products[sale.medicineName].revenue += sale.totalPrice || 0;
      products[sale.medicineName].quantity += sale.quantity;
      
      const itemCost = sale.quantity * (sale.purchasePriceAtTime > 0 ? 
        sale.purchasePriceAtTime : products[sale.medicineName].purchasePrice);
      
      products[sale.medicineName].cost += itemCost;
    });

    return Object.values(products)
      .map(product => ({
        ...product,
        profit: product.revenue - product.cost,
        margin: product.revenue > 0 ? ((product.revenue - product.cost) / product.revenue) * 100 : 0,
        priceDifference: product.currentSalePrice - (product.revenue / product.quantity)
      }))
      .sort((a, b) => b.profit - a.profit);
  };

  const calculateExpenses = (medicines, sales) => {
    const inventoryCost = medicines.reduce((sum, med) => sum + (med.quantity * med.purchasePrice), 0);
    // ✅ تم إزالة مستلزمات التشغيل كما طلبت
    const operationalExpenses = 0;
    
    return {
      inventory: inventoryCost,
      operational: operationalExpenses,
      total: operationalExpenses
    };
  };

  const generateSellerPerformance = (sales) => {
    const sellers = {};
    sales.forEach(sale => {
      if (sale.username && sale.username !== 'البائع') {
        if (!sellers[sale.username]) {
          sellers[sale.username] = { مبيعات: 0, عملاء: 0 };
        }
        sellers[sale.username].مبيعات += sale.totalPrice || 0;
        sellers[sale.username].عملاء += 1;
      }
    });
    
    return Object.entries(sellers)
      .map(([name, data]) => ({
        name,
        مبيعات: data.مبيعات,
        عملاء: data.عملاء
      }))
      .sort((a, b) => b.مبيعات - a.مبيعات)
      .slice(0, 5);
  };

  const generateMockData = () => {
    const mockSales = [
      { 
        medicineName: 'باراسيتامول', 
        quantity: 100, 
        totalPrice: 500, 
        salePriceAtTime: 5,
        purchasePriceAtTime: 3,
        date: new Date() 
      },
      { 
        medicineName: 'فيتامين C', 
        quantity: 50, 
        totalPrice: 750, 
        salePriceAtTime: 15,
        purchasePriceAtTime: 12,
        date: new Date() 
      }
    ];

    const mockMedicines = [
      { name: 'باراسيتامول', purchasePrice: 3, salePrice: 5 },
      { name: 'فيتامين C', purchasePrice: 12, salePrice: 15 }
    ];

    const mockReturns = [
      { medicineName: 'باراسيتامول', quantity: 10, purchasePrice: 3, type: 'return' }
    ];

    const mockDamaged = [
      { medicineName: 'فيتامين C', quantity: 5, purchasePrice: 12, type: 'damaged' }
    ];

    return analyzeFinancialData(mockSales, mockMedicines, mockReturns, mockDamaged, 'monthly', dateRange);
  };

  useEffect(() => {
    fetchFinanceData();
  }, [period, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const showDetails = (product) => {
    setSelectedItem(product);
    setDetailsDialog(true);
  };

  const getProfitColor = (profit) => {
    return profit >= 0 ? 'success' : 'error';
  };

  const getMarginColor = (margin) => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        💰 الإدارة المالية - صيدلية إسلام
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>نظام متكامل:</strong> جميع الحسابات تشمل تأثير المسترجع والتالف على الأرباح. 
        {financeData?.historicalPricesUsed ? ' ✅ يتم استخدام الأسعار التاريخية' : ' ⚠️ بعض البيانات تستخدم الأسعار الحالية'}
      </Alert>

      {/* عناصر التحكم */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>الفترة الزمنية</InputLabel>
            <Select
              value={period}
              label="الفترة الزمنية"
              onChange={(e) => setPeriod(e.target.value)}
            >
              {periods.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {period === 'custom' && (
            <>
              <TextField
                label="من تاريخ"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="إلى تاريخ"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={() => {/* تصدير البيانات */}}
          >
            تصدير
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            طباعة
          </Button>

          <Button 
            variant="contained" 
            onClick={fetchFinanceData}
            color="primary"
          >
            تحديث البيانات
          </Button>
        </Stack>
      </Paper>

      {financeData && (
        <>
          {/* بطاقات الإحصائيات */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6">إجمالي الإيرادات</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {financeData.summary.totalRevenue.toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {financeData.summary.totalSales} عملية بيع
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <InventoryIcon color="secondary" />
                    <Typography variant="h6">التكلفة الإجمالية</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold" color="secondary">
                    {financeData.summary.totalCost.toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    باستخدام الأسعار التاريخية
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="h6">صافي الربح المعدل</Typography>
                  </Stack>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color={getProfitColor(financeData.summary.adjustedProfit)}
                  >
                    {financeData.summary.adjustedProfit.toLocaleString()} ₪
                  </Typography>
                  <Chip 
                    label={`هامش ربح: ${financeData.summary.profitMargin.toFixed(1)}%`}
                    color={getMarginColor(financeData.summary.profitMargin)}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <CalculateIcon color="info" />
                    <Typography variant="h6">متوسط البيع</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {financeData.summary.averageTransaction.toFixed(2)} ₪
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    لكل عملية بيع
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* تأثير المسترجع والتالف */}
          <Grid container spacing={2} mb={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6">📥 إجمالي المسترجع</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    +{financeData.summary.returnsValue.toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2">قيمة مضافة للمخزون</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6">🗑️ إجمالي التالف</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    -{financeData.summary.damagedValue.toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2">خسارة من المخزون</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* الرسوم البيانية */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📈 تطور الإيرادات والأرباح (بما في ذلك المسترجع والتالف)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={financeData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip formatter={(value) => [`${value.toLocaleString()} ₪`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="الإيرادات" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="الأرباح" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🏷️ توزيع المصاريف
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'تكلفة المخزون', value: financeData.expenses.inventory }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#0088FE" />
                    </Pie>
                    <ChartTooltip formatter={(value) => [`${value.toLocaleString()} ₪`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* جدول أداء المنتجات */}
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏆 أداء المنتجات المالية (باستخدام الأسعار التاريخية)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>اسم المنتج</TableCell>
                    <TableCell align="center">الكمية المباعة</TableCell>
                    <TableCell align="center">الإيرادات</TableCell>
                    <TableCell align="center">التكلفة</TableCell>
                    <TableCell align="center">الربح</TableCell>
                    <TableCell align="center">هامش الربح</TableCell>
                    <TableCell align="center">تفاصيل</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {financeData.productPerformance.map((product, index) => (
                    <TableRow key={product.name} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip 
                            label={index + 1} 
                            size="small" 
                            color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"}
                          />
                          <Box>
                            <Typography>{product.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.usesHistoricalPrice ? '✅ أسعار تاريخية' : '⚠️ أسعار حالية'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">{product.quantity}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold" color="success.main">
                          {product.revenue.toLocaleString()} ₪
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography color="text.secondary">
                          {product.cost.toLocaleString()} ₪
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          fontWeight="bold" 
                          color={getProfitColor(product.profit)}
                        >
                          {product.profit.toLocaleString()} ₪
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${product.margin.toFixed(1)}%`}
                          color={getMarginColor(product.margin)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="عرض التفاصيل الكاملة">
                          <IconButton 
                            size="small" 
                            onClick={() => showDetails(product)}
                            color="primary"
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ملخص مالي شامل */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💵 ملخص الربح والخسارة الشامل
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>الإيرادات (الأسعار الفعلية وقت البيع):</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      {financeData.summary.totalRevenue.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>تكلفة البضاعة المباعة (الأسعار التاريخية):</Typography>
                    <Typography color="text.secondary">
                      - {financeData.summary.totalCost.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>الربح الإجمالي:</Typography>
                    <Typography fontWeight="bold" color={getProfitColor(financeData.summary.grossProfit)}>
                      {financeData.summary.grossProfit.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>➕ إضافة المسترجع:</Typography>
                    <Typography fontWeight="bold" color="info.main">
                      + {financeData.summary.returnsValue.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>➖ خصم التالف:</Typography>
                    <Typography fontWeight="bold" color="error">
                      - {financeData.summary.damagedValue.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    <Typography variant="h6">صافي الربح المعدل:</Typography>
                    <Typography variant="h6" color={getProfitColor(financeData.summary.adjustedProfit)}>
                      {financeData.summary.adjustedProfit.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📋 مؤشرات الأداء المتكاملة
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>هامش الربح الإجمالي:</Typography>
                    <Chip 
                      label={`${financeData.summary.profitMargin.toFixed(1)}%`}
                      color={getMarginColor(financeData.summary.profitMargin)}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>متوسط قيمة البيع:</Typography>
                    <Typography fontWeight="bold">
                      {financeData.summary.averageTransaction.toFixed(2)} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>إجمالي المعاملات:</Typography>
                    <Chip label={financeData.summary.totalSales} color="primary" />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>نسبة المسترجع للإيرادات:</Typography>
                    <Chip 
                      label={`${((financeData.summary.returnsValue / financeData.summary.totalRevenue) * 100).toFixed(1)}%`}
                      color="info"
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>نسبة التالف للإيرادات:</Typography>
                    <Chip 
                      label={`${((financeData.summary.damagedValue / financeData.summary.totalRevenue) * 100).toFixed(1)}%`}
                      color="error"
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* نافذة التفاصيل */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon />
            <Typography variant="h6">تفاصيل الأداء المالي - نظام متكامل</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={3}>
              <Typography variant="h6" color="primary">
                {selectedItem.name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">الكمية المباعة:</Typography>
                  <Typography variant="h6">{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">سعر الشراء المستخدم:</Typography>
                  <Typography variant="h6">{selectedItem.purchasePrice} ₪</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedItem.usesHistoricalPrice ? '✅ سعر تاريخي' : '⚠️ سعر حالي'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">الإيرادات (الأسعار الفعلية):</Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedItem.revenue.toLocaleString()} ₪
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">التكلفة (الأسعار التاريخية):</Typography>
                  <Typography variant="h6" color="text.secondary">
                    {selectedItem.cost.toLocaleString()} ₪
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">الربح الفعلي:</Typography>
                  <Typography variant="h6" color={getProfitColor(selectedItem.profit)}>
                    {selectedItem.profit.toLocaleString()} ₪
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">هامش الربح:</Typography>
                  <Chip 
                    label={`${selectedItem.margin.toFixed(1)}%`}
                    color={getMarginColor(selectedItem.margin)}
                    size="medium"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">سعر البيع الحالي:</Typography>
                  <Typography variant="h6" color="info.main">
                    {selectedItem.currentSalePrice} ₪
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">سعر الشراء الحالي:</Typography>
                  <Typography variant="h6">
                    {selectedItem.currentPurchasePrice} ₪
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity={selectedItem.usesHistoricalPrice ? "success" : "warning"}>
                <strong>
                  {selectedItem.usesHistoricalPrice ? 
                    "نظام الأسعار التاريخية مفعل ✅" : 
                    "يتم استخدام الأسعار الحالية ⚠️"
                  }
                </strong> 
                <br />
                {selectedItem.usesHistoricalPrice ? 
                  "هذه الحسابات تعتمد على الأسعار الفعلية وقت البيع ولا تتأثر بتغييرات الأسعار اللاحقة." :
                  "للمبيعات القديمة، يتم استخدام الأسعار الحالية. المبيعات الجديدة ستستخدم الأسعار التاريخية."
                }
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Finance;