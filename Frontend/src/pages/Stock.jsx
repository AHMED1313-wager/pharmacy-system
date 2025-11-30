import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  Card,
  CardContent,
  Stack,
  IconButton,
  Alert,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

// تعريف API_URL في أعلى الملف
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Stock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returns, setReturns] = useState([]);
  const [damaged, setDamaged] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const [stockRes, returnsRes, damagedRes] = await Promise.all([
        axios.get(`${API_URL}/api/stock`),
        axios.get(`${API_URL}/api/returns`),
        axios.get(`${API_URL}/api/damaged`)
      ]);

      setStockItems(stockRes.data);
      setFilteredItems(stockRes.data);
      setReturns(returnsRes.data);
      setDamaged(damagedRes.data);
      checkAlerts(stockRes.data);
    } catch (error) {
      console.error('خطأ في جلب بيانات المخزون:', error);
      setMessage({ type: 'error', text: 'خطأ في جلب بيانات المخزون' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, []);

  useEffect(() => {
    const filtered = stockItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredItems(filtered);
  }, [searchTerm, stockItems]);

  const checkAlerts = (items) => {
    const newAlerts = [];
    const today = new Date();
    
    items.forEach((item) => {
      if (item.quantity <= 5) {
        newAlerts.push({
          type: 'warning',
          message: `الكمية منخفضة للدواء: ${item.name} - الكمية المتبقية: ${item.quantity}`,
          item: item.name
        });
      }
      
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30 && daysToExpiry > 0) {
          newAlerts.push({
            type: 'error',
            message: `الدواء ${item.name} سينتهي خلال ${daysToExpiry} يوم`,
            item: item.name
          });
        } else if (daysToExpiry <= 0) {
          newAlerts.push({
            type: 'error',
            message: `الدواء ${item.name} منتهي الصلاحية`,
            item: item.name
          });
        }
      }
    });
    
    setAlerts(newAlerts);
  };

  const checkAlert = (item) => {
    const today = new Date();
    
    if (item.quantity <= 5) {
      return { type: 'warning', message: 'كمية منخفضة' };
    }
    
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysToExpiry <= 0) {
        return { type: 'error', message: 'منتهي الصلاحية' };
      }
      if (daysToExpiry <= 30) {
        return { type: 'error', message: `ينتهي خلال ${daysToExpiry} يوم` };
      }
    }
    
    return null;
  };

  const getStockValue = () => {
    return stockItems.reduce((total, item) => total + (item.quantity * (item.purchasePrice || 0)), 0);
  };

  const getLowStockCount = () => {
    return stockItems.filter(item => item.quantity <= 10).length;
  };

  const getExpiredCount = () => {
    const today = new Date();
    return stockItems.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) <= today;
    }).length;
  };

  const getReturnsCount = () => {
    return returns.reduce((total, item) => total + item.quantity, 0);
  };

  const getDamagedCount = () => {
    return damaged.reduce((total, item) => total + item.quantity, 0);
  };

  const showItemDetails = (item) => {
    setSelectedItem(item);
    setDetailsDialog(true);
  };

  const getItemReturns = (itemName) => {
    return returns.filter(returnItem => returnItem.medicineName === itemName);
  };

  const getItemDamaged = (itemName) => {
    return damaged.filter(damagedItem => damagedItem.medicineName === itemName);
  };

  const StockDetailsDialog = ({ item, onClose }) => {
    const itemReturns = getItemReturns(item.name);
    const itemDamaged = getItemDamaged(item.name);
    
    return (
      <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">تفاصيل المخزون - {item.name}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* المعلومات الأساسية */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">اسم الدواء:</Typography>
                <Typography variant="h6">{item.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">الصنف:</Typography>
                <Chip label={item.category} color="primary" variant="outlined" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">الكمية الحالية:</Typography>
                <Typography 
                  variant="h4" 
                  color={item.quantity <= 5 ? 'error' : item.quantity <= 10 ? 'warning' : 'success.main'}
                >
                  {item.quantity}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">سعر الشراء:</Typography>
                <Typography variant="h6">{item.purchasePrice || 0} ₪</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">تاريخ الانتهاء:</Typography>
                <Typography variant="body1">
                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : 'غير محدد'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">القيمة الإجمالية:</Typography>
                <Typography variant="h6" color="success.main">
                  {((item.quantity || 0) * (item.purchasePrice || 0)).toLocaleString()} ₪
                </Typography>
              </Grid>
            </Grid>

            {/* المسترجع والتالف */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUpIcon />
                      <Typography variant="h6">المسترجع</Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight="bold">
                      {itemReturns.reduce((sum, ret) => sum + ret.quantity, 0)}
                    </Typography>
                    <Typography variant="body2">
                      {itemReturns.length} عملية
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingDownIcon />
                      <Typography variant="h6">التالف</Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight="bold">
                      {itemDamaged.reduce((sum, dam) => sum + dam.quantity, 0)}
                    </Typography>
                    <Typography variant="body2">
                      {itemDamaged.length} عملية
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* سجل المسترجع */}
            {itemReturns.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom color="info.main">
                  📥 سجل المسترجع
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell align="center">الكمية</TableCell>
                      <TableCell>السبب</TableCell>
                      <TableCell align="center">القيمة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemReturns.map((ret, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(ret.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell align="center">
                          <Chip label={ret.quantity} color="info" size="small" />
                        </TableCell>
                        <TableCell>{ret.reason}</TableCell>
                        <TableCell align="center">
                          <Typography color="success.main">
                            {(ret.quantity * ret.purchasePrice).toLocaleString()} ₪
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* سجل التالف */}
            {itemDamaged.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom color="error">
                  🗑️ سجل التالف
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell align="center">الكمية</TableCell>
                      <TableCell>السبب</TableCell>
                      <TableCell align="center">الخسارة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemDamaged.map((dam, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(dam.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell align="center">
                          <Chip label={dam.quantity} color="error" size="small" />
                        </TableCell>
                        <TableCell>{dam.reason}</TableCell>
                        <TableCell align="center">
                          <Typography color="error">
                            {(dam.quantity * dam.purchasePrice).toLocaleString()} ₪
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {itemReturns.length === 0 && itemDamaged.length === 0 && (
              <Alert severity="info">
                لا توجد عمليات مسترجع أو تالف لهذا الدواء
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        📦 إدارة المخزون - صيدلية إسلام
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* بطاقة الإحصائيات */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <Card sx={{ flex: 1, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InventoryIcon />
              <Typography variant="h6">إجمالي المخزون</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold">
              {stockItems.length}
            </Typography>
            <Typography variant="body2">صنف دوائي</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <WarningIcon />
              <Typography variant="h6">الأدوية المنخفضة</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold">
              {getLowStockCount()}
            </Typography>
            <Typography variant="body2">تحتاج إعادة طلب</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'error.main', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ErrorIcon />
              <Typography variant="h6">منتهية الصلاحية</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold">
              {getExpiredCount()}
            </Typography>
            <Typography variant="body2">تحتاج إزالة</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'info.main', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUpIcon />
              <Typography variant="h6">المسترجع</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold">
              {getReturnsCount()}
            </Typography>
            <Typography variant="body2">وحدة مرتجعة</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h6">القيمة الإجمالية</Typography>
            <Typography variant="h4" fontWeight="bold">
              {getStockValue().toLocaleString()} ₪
            </Typography>
            <Typography variant="body2">قيمة المخزون</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* التنبيهات */}
      {alerts.length > 0 && (
        <Box mb={3}>
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.type} 
              sx={{ mb: 1 }}
              icon={alert.type === 'warning' ? <WarningIcon /> : <ErrorIcon />}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* أدوات التحكم */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="🔍 بحث في المخزون"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            placeholder="ابحث باسم الدواء، الصنف، أو الشركة المصنعة..."
            InputProps={{
              endAdornment: (
                <IconButton size="small">
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />

          <Tooltip title="تحديث البيانات">
            <IconButton onClick={fetchStockItems} color="primary" size="large">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button 
            variant="outlined" 
            startIcon={<InventoryIcon />}
            onClick={() => window.open('/returns', '_blank')}
          >
            إدارة المسترجع والتالف
          </Button>
        </Stack>
      </Paper>

      {/* جدول المخزون */}
      <Paper elevation={3}>
        {loading && <LinearProgress />}
        
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>اسم الدواء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الصنف</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الكمية المتبقية</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">تاريخ الانتهاء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">سعر الشراء</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">القيمة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الحالة</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">تفاصيل</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const alert = checkAlert(item);
              const itemValue = (item.quantity || 0) * (item.purchasePrice || 0);
              const itemReturns = getItemReturns(item.name);
              const itemDamaged = getItemDamaged(item.name);
              
              return (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight="bold">{item.name}</Typography>
                      {item.manufacturer && (
                        <Typography variant="caption" color="text.secondary">
                          {item.manufacturer}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      fontWeight="bold" 
                      color={item.quantity <= 5 ? 'error' : item.quantity <= 10 ? 'warning' : 'inherit'}
                    >
                      {item.quantity}
                    </Typography>
                    {(itemReturns.length > 0 || itemDamaged.length > 0) && (
                      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
                        {itemReturns.length > 0 && (
                          <Tooltip title={`${itemReturns.reduce((sum, ret) => sum + ret.quantity, 0)} وحدة مسترجع`}>
                            <Chip 
                              label={itemReturns.reduce((sum, ret) => sum + ret.quantity, 0)} 
                              color="info" 
                              size="small" 
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                        {itemDamaged.length > 0 && (
                          <Tooltip title={`${itemDamaged.reduce((sum, dam) => sum + dam.quantity, 0)} وحدة تالف`}>
                            <Chip 
                              label={itemDamaged.reduce((sum, dam) => sum + dam.quantity, 0)} 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {item.expiryDate ? (
                      <Typography 
                        variant="body2"
                        color={new Date(item.expiryDate) <= new Date() ? 'error' : 'inherit'}
                      >
                        {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {item.purchasePrice ? (
                      <Typography variant="body2">{item.purchasePrice} ₪</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="success.main">
                      {itemValue.toLocaleString()} ₪
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {alert ? (
                      <Chip 
                        label={alert.message} 
                        color={alert.type} 
                        size="small" 
                      />
                    ) : (
                      <Chip label="جيد" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="عرض التفاصيل الكاملة">
                      <IconButton 
                        size="small" 
                        onClick={() => showItemDetails(item)}
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredItems.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <InventoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد عناصر تطابق البحث' : 'لا توجد عناصر في المخزون'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* نافذة التفاصيل */}
      {detailsDialog && selectedItem && (
        <StockDetailsDialog 
          item={selectedItem} 
          onClose={() => setDetailsDialog(false)} 
        />
      )}

      {/* معلومات عن نظام المخزون */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>معلومات عن نظام المخزون - صيدلية إسلام:</strong>
        <br />
        • 📊 <strong>المخزون الحالي:</strong> يعكس الكميات الفعلية بعد جميع عمليات البيع والمسترجع والتالف
        <br />
        • 📥 <strong>المسترجع:</strong> يزيد كمية الدواء في المخزون (مرتجع من العملاء)
        <br />
        • 🗑️ <strong>التالف:</strong> ينقص كمية الدواء في المخزون (منتهي الصلاحية أو معطوب)
        <br />
        • جميع التحديثات تتم تلقائياً وفي الوقت الفعلي
      </Alert>
    </Box>
  );
};

export default Stock;
