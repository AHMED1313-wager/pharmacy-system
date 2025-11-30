import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Button,
  Paper,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { user } = useContext(AuthContext);

  // إعدادات التنبيهات
  const [alertSettings, setAlertSettings] = useState({
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    criticalStockThreshold: 5
  });

  // تعريف API_URL في أعلى الملف
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // تحديث كل 30 ثانية
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notificationsRes, medicinesRes] = await Promise.all([
        axios.get(`${API_URL}/api/notifications`),
        axios.get(`${API_URL}/api/medicines`)
      ]);
      
      setNotifications(notificationsRes.data);
      setMedicines(medicinesRes.data);
      
      // التحقق التلقائي من المخزون وتواريخ الصلاحية
      await checkAutomaticAlerts(medicinesRes.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAutomaticAlerts = async (medicinesData) => {
    const today = new Date();
    const newAlerts = [];

    medicinesData.forEach(medicine => {
      // التحقق من المخزون المنخفض
      if (medicine.quantity <= alertSettings.criticalStockThreshold) {
        newAlerts.push({
          type: 'critical',
          medicineName: medicine.name,
          details: `المخزون منخفض جداً! الكمية المتبقية: ${medicine.quantity}`,
          priority: 1
        });
      } else if (medicine.quantity <= alertSettings.lowStockThreshold) {
        newAlerts.push({
          type: 'warning',
          medicineName: medicine.name,
          details: `المخزون منخفض. الكمية المتبقية: ${medicine.quantity}`,
          priority: 2
        });
      }

      // التحقق من تاريخ الصلاحية
      if (medicine.expiryDate) {
        const expiryDate = new Date(medicine.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry <= 0) {
          newAlerts.push({
            type: 'expired',
            medicineName: medicine.name,
            details: `الدواء منتهي الصلاحية!`,
            priority: 1
          });
        } else if (daysToExpiry <= alertSettings.expiryWarningDays) {
          newAlerts.push({
            type: 'expiry_warning',
            medicineName: medicine.name,
            details: `ينتهي الصلاحية خلال ${daysToExpiry} يوم`,
            priority: 2
          });
        }
      }
    });

    // حفظ التنبيهات الجديدة (يمكن تطوير هذا الجزء لحفظ في قاعدة البيانات)
    if (newAlerts.length > 0) {
      console.log('تم اكتشاف تنبيهات جديدة:', newAlerts);
      // هنا يمكن إضافة كود لحفظ التنبيهات في قاعدة البيانات
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }

    setFilteredNotifications(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل تريد حذف هذا التنبيه؟')) {
      try {
        await axios.delete(`${API_URL}/api/notifications/${id}`);
        fetchData();
      } catch (error) {
        console.error('خطأ في حذف التنبيه:', error);
      }
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm('هل تريد حذف جميع التنبيهات؟')) {
      try {
        // حذف جميع التنبيهات (هذا مثال - قد تحتاج لتعديله حسب API)
        for (const notif of notifications) {
          await axios.delete(`${API_URL}/api/notifications/${notif._id}`);
        }
        fetchData();
      } catch (error) {
        console.error('خطأ في حذف التنبيهات:', error);
      }
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
      case 'expired':
        return <ErrorIcon color="error" />;
      case 'warning':
      case 'expiry_warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
      case 'expired':
        return 'error';
      case 'warning':
      case 'expiry_warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getAlertText = (type) => {
    switch (type) {
      case 'critical':
        return 'حرج';
      case 'warning':
        return 'تحذير';
      case 'expired':
        return 'منتهي';
      case 'expiry_warning':
        return 'انتهاء قريب';
      default:
        return 'معلومة';
    }
  };

  const getStatistics = () => {
    const critical = notifications.filter(n => n.type === 'critical' || n.type === 'expired').length;
    const warnings = notifications.filter(n => n.type === 'warning' || n.type === 'expiry_warning').length;
    const total = notifications.length;

    return { critical, warnings, total };
  };

  const stats = getStatistics();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        🔔 التنبيهات والإشعارات
      </Typography>

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <NotificationsIcon />
                <Typography variant="h6">إجمالي التنبيهات</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2">تنبيه نشط</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ErrorIcon />
                <Typography variant="h6">تنبيهات حرجة</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.critical}
              </Typography>
              <Typography variant="body2">تحتاج تدخل فوري</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon />
                <Typography variant="h6">تحذيرات</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {stats.warnings}
              </Typography>
              <Typography variant="body2">تحتاج متابعة</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon />
                <Typography variant="h6">الأدوية المراقبة</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {medicines.length}
              </Typography>
              <Typography variant="body2">دواء في النظام</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* شريط التحكم */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>تصفية التنبيهات</InputLabel>
            <Select
              value={filterType}
              label="تصفية التنبيهات"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">جميع التنبيهات</MenuItem>
              <MenuItem value="critical">حرجة</MenuItem>
              <MenuItem value="warning">تحذيرات</MenuItem>
              <MenuItem value="expired">منتهية الصلاحية</MenuItem>
              <MenuItem value="expiry_warning">انتهاء قريب</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="التحديث التلقائي"
          />

          <Tooltip title="تحديث البيانات">
            <IconButton onClick={fetchData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="إعدادات التنبيهات">
            <IconButton onClick={() => setSettingsDialog(true)} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            onClick={() => setFilterType('all')}
          >
            إعادة التعيين
          </Button>

          {user.role === 'admin' && notifications.length > 0 && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearAllNotifications}
            >
              مسح الكل
            </Button>
          )}
        </Stack>
      </Paper>

      {/* قائمة التنبيهات */}
      {filteredNotifications.length > 0 ? (
        <Paper elevation={3}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>نوع التنبيه</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>تفاصيل</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>تاريخ الإنشاء</TableCell>
                {user.role === 'admin' && <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNotifications.map((notif) => (
                <TableRow key={notif._id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getAlertIcon(notif.type)}
                      <Chip 
                        label={getAlertText(notif.type)} 
                        color={getAlertColor(notif.type)} 
                        size="small" 
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{notif.medicineName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{notif.details}</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(notif.createdAt).toLocaleString('en-US')}
                  </TableCell>
                  {user.role === 'admin' && (
                    <TableCell align="center">
                      <Tooltip title="حذف التنبيه">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDelete(notif._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          🎉 لا توجد تنبيهات لعرضها حالياً. جميع الأدوية في حالة جيدة!
        </Alert>
      )}

      {/* عرض تنبيهات النظام التلقائية */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom color="primary">
          📋 مراقبة النظام التلقائية
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚠️ الأدوية منخفضة المخزون
                </Typography>
                {medicines.filter(m => m.quantity <= alertSettings.lowStockThreshold).length > 0 ? (
                  medicines
                    .filter(m => m.quantity <= alertSettings.lowStockThreshold)
                    .map(medicine => (
                      <Alert 
                        key={medicine._id} 
                        severity={medicine.quantity <= alertSettings.criticalStockThreshold ? "error" : "warning"}
                        sx={{ mb: 1 }}
                      >
                        {medicine.name} - الكمية: {medicine.quantity}
                        {medicine.quantity <= alertSettings.criticalStockThreshold && ' ⚠️ حرج!'}
                      </Alert>
                    ))
                ) : (
                  <Typography color="text.secondary">لا توجد أدوية منخفضة المخزون</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="error.main">
                  📅 الأدوية القريبة من الانتهاء
                </Typography>
                {medicines.filter(m => {
                  if (!m.expiryDate) return false;
                  const expiry = new Date(m.expiryDate);
                  const today = new Date();
                  const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                  return daysToExpiry <= alertSettings.expiryWarningDays;
                }).length > 0 ? (
                  medicines
                    .filter(m => {
                      if (!m.expiryDate) return false;
                      const expiry = new Date(m.expiryDate);
                      const today = new Date();
                      const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                      return daysToExpiry <= alertSettings.expiryWarningDays;
                    })
                    .map(medicine => {
                      const expiry = new Date(medicine.expiryDate);
                      const today = new Date();
                      const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <Alert 
                          key={medicine._id} 
                          severity={daysToExpiry <= 0 ? "error" : "warning"}
                          sx={{ mb: 1 }}
                        >
                          {medicine.name} - ينتهي في {new Date(medicine.expiryDate).toLocaleDateString('en-US')}
                          {daysToExpiry <= 0 ? ' ⛔ منتهي!' : ` (${daysToExpiry} يوم)`}
                        </Alert>
                      );
                    })
                ) : (
                  <Typography color="text.secondary">لا توجد أدوية قريبة من الانتهاء</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* نافذة إعدادات التنبيهات */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon />
            <Typography variant="h6">إعدادات نظام التنبيهات</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="حد الإنخفاض الحرج للمخزون"
              type="number"
              value={alertSettings.criticalStockThreshold}
              onChange={(e) => setAlertSettings({
                ...alertSettings,
                criticalStockThreshold: parseInt(e.target.value)
              })}
              helperText="عند وصول المخزون لهذا الحد، يتم إرسال تنبيه حرج"
              fullWidth
            />
            
            <TextField
              label="حد الإنخفاض العادي للمخزون"
              type="number"
              value={alertSettings.lowStockThreshold}
              onChange={(e) => setAlertSettings({
                ...alertSettings,
                lowStockThreshold: parseInt(e.target.value)
              })}
              helperText="عند وصول المخزون لهذا الحد، يتم إرسال تنبيه تحذيري"
              fullWidth
            />
            
            <TextField
              label="أيام التحذير قبل انتهاء الصلاحية"
              type="number"
              value={alertSettings.expiryWarningDays}
              onChange={(e) => setAlertSettings({
                ...alertSettings,
                expiryWarningDays: parseInt(e.target.value)
              })}
              helperText="عدد الأيام قبل انتهاء الصلاحية لإرسال التنبيه"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>إلغاء</Button>
          <Button 
            onClick={() => {
              setSettingsDialog(false);
              fetchData(); // إعادة فحص البيانات بالإعدادات الجديدة
            }} 
            variant="contained"
          >
            حفظ الإعدادات
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;
