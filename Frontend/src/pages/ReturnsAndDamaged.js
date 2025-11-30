import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Grid, Card, CardContent, Stack, Alert, FormControl,
  InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, 
  History as HistoryIcon, 
  BrokenImage as DamagedIcon,
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

// تعريف API_URL في أعلى الملف
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ReturnsAndDamaged = () => {
  const [tabValue, setTabValue] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [returns, setReturns] = useState([]);
  const [damaged, setDamaged] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchMedicines();
    fetchReturns();
    fetchDamaged();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/medicines`);
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMessage({ type: 'error', text: 'خطأ في جلب قائمة الأدوية' });
    }
  };

  const fetchReturns = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/returns`);
      setReturns(response.data);
    } catch (error) {
      console.log('No returns data yet');
      setReturns([]);
    }
  };

  const fetchDamaged = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/damaged`);
      setDamaged(response.data);
    } catch (error) {
      console.log('No damaged data yet');
      setDamaged([]);
    }
  };

  const handleAddReturn = async () => {
    if (!selectedMedicine || !quantity || quantity <= 0) {
      setMessage({ type: 'error', text: 'يرجى اختيار دواء وكمية صحيحة' });
      return;
    }

    setLoading(true);
    try {
      const returnData = {
        medicineId: selectedMedicine,
        quantity: parseInt(quantity),
        reason
      };

      await axios.post(`${API_URL}/api/returns`, returnData);

      setMessage({ type: 'success', text: 'تمت إضافة المسترجع وتحديث المخزون بنجاح' });
      setSelectedMedicine('');
      setQuantity('');
      setReason('');
      
      fetchMedicines();
      fetchReturns();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطأ في إضافة المسترجع' });
    }
    setLoading(false);
  };

  const handleAddDamaged = async () => {
    if (!selectedMedicine || !quantity || quantity <= 0) {
      setMessage({ type: 'error', text: 'يرجى اختيار دواء وكمية صحيحة' });
      return;
    }

    setLoading(true);
    try {
      const damagedData = {
        medicineId: selectedMedicine,
        quantity: parseInt(quantity),
        reason
      };

      await axios.post(`${API_URL}/api/damaged`, damagedData);

      setMessage({ type: 'success', text: 'تمت إضافة التالف وتحديث المخزون بنجاح' });
      setSelectedMedicine('');
      setQuantity('');
      setReason('');
      
      fetchMedicines();
      fetchDamaged();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطأ في إضافة التالف' });
    }
    setLoading(false);
  };

  const getTotalReturns = () => {
    return returns.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalDamaged = () => {
    return damaged.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalReturnsValue = () => {
    return returns.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  };

  const getTotalDamagedValue = () => {
    return damaged.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  };

  const showDetails = (item) => {
    setSelectedItem(item);
    setDetailsDialog(true);
  };

  const getMedicineStock = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    return medicine ? medicine.quantity : 0;
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        📦 إدارة المسترجع والتالف - صيدلية إسلام
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HistoryIcon />
                <Typography variant="h6">إجمالي المسترجع</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {getTotalReturns()}
              </Typography>
              <Typography variant="body2">
                {getTotalReturnsValue().toLocaleString()} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DamagedIcon />
                <Typography variant="h6">إجمالي التالف</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {getTotalDamaged()}
              </Typography>
              <Typography variant="body2">
                {getTotalDamagedValue().toLocaleString()} ₪
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon />
                <Typography variant="h6">صافي الربح</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {getTotalReturnsValue().toLocaleString()} ₪
              </Typography>
              <Typography variant="body2">من المسترجع</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingDownIcon />
                <Typography variant="h6">الخسارة</Typography>
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {getTotalDamagedValue().toLocaleString()} ₪
              </Typography>
              <Typography variant="body2">من التالف</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="📥 المسترجع" />
          <Tab label="🗑️ التالف" />
          <Tab label="📋 السجل التاريخي" />
        </Tabs>

        <Box p={3}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom color="primary">
                إضافة مسترجع (مرتجع من العميل)
              </Typography>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>اختر الدواء</InputLabel>
                    <Select
                      value={selectedMedicine}
                      label="اختر الدواء"
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                    >
                      {medicines.map((medicine) => (
                        <MenuItem key={medicine._id} value={medicine._id}>
                          {medicine.name} - المتاح: {medicine.quantity}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="الكمية"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="سبب الإرجاع"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    fullWidth
                    placeholder="مثال: تغيير من العميل، عيب في التصنيع، إلخ."
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddReturn}
                    disabled={loading}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    إضافة
                  </Button>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }} color="primary">
                📋 سجل المسترجع
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الكمية</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>السبب</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">القيمة</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">التاريخ</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">تفاصيل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returns.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography fontWeight="bold">{item.medicineName}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantity} color="info" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.reason}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold" color="success.main">
                            {(item.quantity * item.purchasePrice).toLocaleString()} ₪
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {new Date(item.date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="عرض التفاصيل">
                            <IconButton 
                              size="small" 
                              onClick={() => showDetails(item)}
                              color="primary"
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {returns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            لا توجد مسترجعات
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                إضافة تالف (منتهي الصلاحية أو معطوب)
              </Typography>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>اختر الدواء</InputLabel>
                    <Select
                      value={selectedMedicine}
                      label="اختر الدواء"
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                    >
                      {medicines.map((medicine) => (
                        <MenuItem key={medicine._id} value={medicine._id}>
                          {medicine.name} - المتاح: {medicine.quantity}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="الكمية"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="سبب التلف"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    fullWidth
                    placeholder="مثال: انتهاء الصلاحية، كسر، تلف بالتخزين، إلخ."
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<AddIcon />}
                    onClick={handleAddDamaged}
                    disabled={loading}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    إضافة
                  </Button>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }} color="error">
                📋 سجل التالف
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'error.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الكمية</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>السبب</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الخسارة</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">التاريخ</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">تفاصيل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {damaged.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography fontWeight="bold">{item.medicineName}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantity} color="error" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.reason}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold" color="error">
                            {(item.quantity * item.purchasePrice).toLocaleString()} ₪
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {new Date(item.date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="عرض التفاصيل">
                            <IconButton 
                              size="small" 
                              onClick={() => showDetails(item)}
                              color="error"
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {damaged.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            لا توجد تالف
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom color="primary">
                📊 السجل التاريخي للمسترجع والتالف
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>النوع</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الدواء</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">الكمية</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>السبب</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">القيمة/الخسارة</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">التاريخ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...returns, ...damaged]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip 
                              label={item.type === 'return' ? 'مسترجع' : 'تالف'} 
                              color={item.type === 'return' ? 'info' : 'error'} 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="bold">{item.medicineName}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold">{item.quantity}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.reason}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography 
                              fontWeight="bold" 
                              color={item.type === 'return' ? 'success.main' : 'error'}
                            >
                              {(item.quantity * item.purchasePrice).toLocaleString()} ₪
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {new Date(item.date).toLocaleDateString('en-GB')}
                          </TableCell>
                        </TableRow>
                      ))}
                    {returns.length === 0 && damaged.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            لا توجد سجلات
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* نافذة التفاصيل */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">تفاصيل العملية</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={2}>
              <Typography variant="h6" color="primary">
                {selectedItem.medicineName}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">النوع:</Typography>
                  <Chip 
                    label={selectedItem.type === 'return' ? 'مسترجع' : 'تالف'} 
                    color={selectedItem.type === 'return' ? 'info' : 'error'} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">الكمية:</Typography>
                  <Typography variant="h6">{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">سعر الشراء:</Typography>
                  <Typography variant="h6">{selectedItem.purchasePrice} ₪</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">سعر البيع:</Typography>
                  <Typography variant="h6">{selectedItem.sellingPrice} ₪</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">السبب:</Typography>
                  <Typography variant="body1" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    {selectedItem.reason}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">القيمة الإجمالية:</Typography>
                  <Typography 
                    variant="h6" 
                    color={selectedItem.type === 'return' ? 'success.main' : 'error'}
                  >
                    {(selectedItem.quantity * selectedItem.purchasePrice).toLocaleString()} ₪
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">التاريخ:</Typography>
                  <Typography variant="body1">
                    {new Date(selectedItem.date).toLocaleDateString('en-GB')}
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity={selectedItem.type === 'return' ? "info" : "warning"}>
                <strong>
                  {selectedItem.type === 'return' ? 
                    "✅ هذا المسترجع تمت إضافته إلى المخزون" : 
                    "⚠️ هذا التالف تم خصمه من المخزون"
                  }
                </strong>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* معلومات إضافية */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>معلومات عن نظام المسترجع والتالف:</strong>
        <br />
        • 📥 <strong>المسترجع:</strong> يزيد كمية الدواء في المخزون ويحسب كقيمة مضافة
        <br />
        • 🗑️ <strong>التالف:</strong> ينقص كمية الدواء في المخزون ويحسب كخسارة
        <br />
        • جميع العمليات تؤثر تلقائياً على المخزون والتقارير المالية
      </Alert>
    </Box>
  );
};

export default ReturnsAndDamaged;
