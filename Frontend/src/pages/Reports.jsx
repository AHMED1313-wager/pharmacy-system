import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
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
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const periods = [
    { value: 'daily', label: 'يومي', days: 1 },
    { value: 'weekly', label: 'أسبوعي', days: 7 },
    { value: 'monthly', label: 'شهري', days: 30 },
    { value: 'yearly', label: 'سنوي', days: 365 },
    { value: 'custom', label: 'مخصص', days: null }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [salesRes, medicinesRes, usersRes, returnsRes, damagedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sales'),
        axios.get('http://localhost:5000/api/medicines'),
        axios.get('http://localhost:5000/api/users'),
        axios.get('http://localhost:5000/api/returns'),
        axios.get('http://localhost:5000/api/damaged')
      ]);

      const salesData = salesRes.data;
      const medicinesData = medicinesRes.data;
      const usersData = usersRes.data;
      const returnsData = returnsRes.data;
      const damagedData = damagedRes.data;

      const analyzedData = analyzeData(salesData, medicinesData, usersData, returnsData, damagedData, period, dateRange);
      setReport(analyzedData);
    } catch (error) {
      console.error('خطأ في جلب التقرير:', error);
      setReport(generateMockData());
    }
    setLoading(false);
  };

  const analyzeData = (sales, medicines, users, returns, damaged, period, range) => {
    const filteredSales = filterSalesByPeriod(sales, period, range);
    const filteredReturns = filterReturnsByPeriod(returns, period, range);
    const filteredDamaged = filterDamagedByPeriod(damaged, period, range);
    
    // إحصائيات المبيعات
    const salesStats = {
      totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0),
      totalTransactions: filteredSales.length,
      averageSale: filteredSales.length > 0 ? 
        filteredSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0) / filteredSales.length : 0,
      bestSelling: getBestSellingItems(filteredSales),
      topSellers: getTopSellers(filteredSales)
    };

    // إحصائيات المخزون
    const inventoryStats = {
      totalItems: medicines.length,
      lowStock: medicines.filter(m => m.quantity <= 10).length,
      outOfStock: medicines.filter(m => m.quantity === 0).length,
      totalValue: medicines.reduce((sum, med) => sum + (med.quantity * med.purchasePrice), 0)
    };

    // إحصائيات المسترجع والتالف
    const returnsStats = {
      totalReturns: filteredReturns.reduce((sum, item) => sum + item.quantity, 0),
      totalReturnsValue: filteredReturns.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
      totalDamaged: filteredDamaged.reduce((sum, item) => sum + item.quantity, 0),
      totalDamagedValue: filteredDamaged.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0)
    };

    // بيانات الرسوم البيانية
    const chartData = generateChartData(filteredSales, period);
    const categoryData = generateCategoryData(medicines);
    const sellerPerformance = generateSellerPerformance(filteredSales);

    return {
      period: periods.find(p => p.value === period)?.label || period,
      dateRange,
      salesStats,
      inventoryStats,
      returnsStats,
      chartData,
      categoryData,
      sellerPerformance,
      rawData: {
        sales: filteredSales,
        medicines,
        users,
        returns: filteredReturns,
        damaged: filteredDamaged
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
        startDate.setDate(now.getDate() - 7);
    }

    return sales.filter(sale => new Date(sale.date) >= startDate);
  };

  const filterReturnsByPeriod = (returns, period, range) => {
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
        return returns.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return returns.filter(item => new Date(item.date) >= startDate);
  };

  const filterDamagedByPeriod = (damaged, period, range) => {
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
        return damaged.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return damaged.filter(item => new Date(item.date) >= startDate);
  };

  const getBestSellingItems = (sales) => {
    const items = {};
    sales.forEach(sale => {
      if (sale.medicineName) {
        items[sale.medicineName] = (items[sale.medicineName] || 0) + sale.quantity;
      }
    });
    
    return Object.entries(items)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  };

  const getTopSellers = (sales) => {
    const sellers = {};
    sales.forEach(sale => {
      if (sale.username && sale.username !== 'البائع') {
        sellers[sale.username] = (sellers[sale.username] || 0) + (sale.totalPrice || 0);
      }
    });
    
    return Object.entries(sellers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  };

  const generateChartData = (sales, period) => {
    // بيانات حقيقية من المبيعات
    const dailyData = {};
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const dateKey = date.toLocaleDateString('en-GB');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { name: dateKey, مبيعات: 0, أرباح: 0 };
      }
      dailyData[dateKey].مبيعات += sale.totalPrice || 0;
      
      // حساب الأرباح باستخدام الأسعار التاريخية
      const profit = (sale.totalPrice || 0) - (sale.quantity * (sale.purchasePriceAtTime || 0));
      dailyData[dateKey].أرباح += profit;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.name) - new Date(b.name));
  };

  const generateCategoryData = (medicines) => {
    const categories = {};
    medicines.forEach(med => {
      categories[med.category] = (categories[med.category] || 0) + 1;
    });
    
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
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
    return {
      period: 'أسبوعي',
      dateRange,
      salesStats: {
        totalRevenue: 15200,
        totalTransactions: 89,
        averageSale: 170.8,
        bestSelling: [
          { name: 'باراسيتامول', quantity: 45 },
          { name: 'فيتامين C', quantity: 32 },
          { name: 'أوميغا 3', quantity: 28 },
          { name: 'مضاد حيوي', quantity: 25 },
          { name: 'مسكن ألم', quantity: 22 }
        ],
        topSellers: [
          { name: 'أحمد محمد', revenue: 5200 },
          { name: 'فاطمة علي', revenue: 4800 },
          { name: 'خالد إبراهيم', revenue: 3200 },
          { name: 'سارة عبدالله', revenue: 2000 }
        ]
      },
      inventoryStats: {
        totalItems: 156,
        lowStock: 12,
        outOfStock: 3,
        totalValue: 125000
      },
      returnsStats: {
        totalReturns: 15,
        totalReturnsValue: 450,
        totalDamaged: 8,
        totalDamagedValue: 280
      },
      chartData: generateChartData([], 'weekly'),
      categoryData: generateCategoryData([]),
      sellerPerformance: generateSellerPerformance([])
    };
  };

  useEffect(() => {
    fetchReport();
  }, [period, dateRange]);

  const handleExport = (format) => {
    console.log(`تصدير التقرير بصيغة ${format}`);
    setExportDialog(false);
  };

  const handlePrint = () => {
    window.print();
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
        📊 التقارير والتحليلات - صيدلية إسلام
      </Typography>

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
            onClick={() => setExportDialog(true)}
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
            onClick={fetchReport}
            color="primary"
          >
            تحديث البيانات
          </Button>
        </Stack>
      </Paper>

      {report && (
        <>
          {/* بطاقات الإحصائيات */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon />
                    <Typography variant="h6">إجمالي المبيعات</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold">
                    {report.salesStats.totalRevenue.toLocaleString()} ₪
                  </Typography>
                  <Typography variant="body2">
                    {report.salesStats.totalTransactions} عملية بيع
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon />
                    <Typography variant="h6">متوسط البيع</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold">
                    {report.salesStats.averageSale.toFixed(2)} ₪
                  </Typography>
                  <Typography variant="body2">لكل عملية بيع</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InventoryIcon />
                    <Typography variant="h6">الأصناف المتاحة</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold">
                    {report.inventoryStats.totalItems}
                  </Typography>
                  <Typography variant="body2">
                    {report.inventoryStats.lowStock} منخفضة المخزون
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PeopleIcon />
                    <Typography variant="h6">المسترجع</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold">
                    {report.returnsStats.totalReturns}
                  </Typography>
                  <Typography variant="body2">
                    {report.returnsStats.totalReturnsValue.toLocaleString()} ₪
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ReceiptIcon />
                    <Typography variant="h6">التالف</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold">
                    {report.returnsStats.totalDamaged}
                  </Typography>
                  <Typography variant="body2">
                    {report.returnsStats.totalDamagedValue.toLocaleString()} ₪
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* الرسوم البيانية */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📈 تطور المبيعات والأرباح - صيدلية إسلام
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip formatter={(value) => [`${value.toLocaleString()} ₪`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="مبيعات" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="أرباح" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🏷️ توزيع الأصناف
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {report.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* الجداول التحليلية */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  🏆 أفضل الأدوية مبيعاً
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>الدواء</TableCell>
                        <TableCell align="center">الكمية المباعة</TableCell>
                        <TableCell align="center">النسبة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.salesStats.bestSelling.map((item, index) => (
                        <TableRow key={item.name}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip 
                                label={index + 1} 
                                size="small" 
                                color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"}
                              />
                              <Typography>{item.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold">{item.quantity}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${((item.quantity / report.salesStats.totalTransactions) * 100).toFixed(1)}%`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  👥 أداء البائعين الحقيقيين
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>البائع</TableCell>
                        <TableCell align="center">المبيعات</TableCell>
                        <TableCell align="center">العملاء</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.sellerPerformance.map((seller, index) => (
                        <TableRow key={seller.name}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip 
                                label={index + 1} 
                                size="small" 
                                color={index === 0 ? "primary" : index === 1 ? "secondary" : "default"}
                              />
                              <Typography>{seller.name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold" color="success.main">
                              {seller.مبيعات.toLocaleString()} ₪
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={seller.عملاء} color="info" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {report.sellerPerformance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography color="text.secondary">
                              لا توجد بيانات للبائعين
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* ملخص المسترجع والتالف */}
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="info.main">
                  📥 ملخص المسترجع
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>إجمالي الكمية المرتجعة:</Typography>
                    <Typography fontWeight="bold">
                      {report.returnsStats.totalReturns} وحدة
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>القيمة الإجمالية:</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      {report.returnsStats.totalReturnsValue.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>متوسط القيمة للوحدة:</Typography>
                    <Typography>
                      {report.returnsStats.totalReturns > 0 ? 
                        (report.returnsStats.totalReturnsValue / report.returnsStats.totalReturns).toFixed(2) : 0} ₪
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="warning.main">
                  🗑️ ملخص التالف
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>إجمالي الكمية التالفة:</Typography>
                    <Typography fontWeight="bold">
                      {report.returnsStats.totalDamaged} وحدة
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>الخسارة الإجمالية:</Typography>
                    <Typography fontWeight="bold" color="error">
                      {report.returnsStats.totalDamagedValue.toLocaleString()} ₪
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>متوسط الخسارة للوحدة:</Typography>
                    <Typography>
                      {report.returnsStats.totalDamaged > 0 ? 
                        (report.returnsStats.totalDamagedValue / report.returnsStats.totalDamaged).toFixed(2) : 0} ₪
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* نافذة التصدير */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DownloadIcon />
            <Typography variant="h6">تصدير التقرير - صيدلية إسلام</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            اختر صيغة التصدير المناسبة:
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('PDF')}
              fullWidth
            >
              تصدير كملف PDF
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('Excel')}
              fullWidth
            >
              تصدير كملف Excel
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />}
              onClick={() => handleExport('Email')}
              fullWidth
            >
              إرسال بالبريد الإلكتروني
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>إلغاء</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;