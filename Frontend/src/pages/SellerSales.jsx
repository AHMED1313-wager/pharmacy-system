import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, MenuItem, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

// تعريف API_URL في أعلى الملف
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SellerSales = () => {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedMed, setSelectedMed] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fetchMedicines = async () => {
    const { data } = await axios.get(`${API_URL}/api/medicines`);
    setMedicines(data);
  };

  const fetchSales = async () => {
    const { data } = await axios.get(`${API_URL}/api/sales`);
    setSales(data);
  };

  useEffect(() => {
    fetchMedicines();
    fetchSales();
  }, []);

  const handleAddSale = async () => {
    if (!selectedMed || quantity <= 0) return;
    await axios.post(`${API_URL}/api/sales`, { medicineId: selectedMed, quantitySold: quantity, sellerName: 'seller001' /* استبدل باليوزر الحالي */ });
    fetchSales();
  };

  const medicineName = medicines.find(m => m._id === selectedMed)?.name || '';

  return (
    <Box p={2}>
      <Typography variant="h6" mb={2}>إضافة بيع</Typography>

      <TextField select label="الصنف" value={selectedMed} onChange={e => setSelectedMed(e.target.value)} sx={{ minWidth: 250, mb: 2 }}>
        {medicines.map(med => (
          <MenuItem key={med._id} value={med._id}>{med.name} - سعر: {med.salePrice}</MenuItem>
        ))}
      </TextField>

      <TextField type="number" label="الكمية" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} sx={{ minWidth: 120, mb: 2, ml: 2 }} />

      <Button variant="contained" onClick={handleAddSale}>بيع</Button>

      <Typography variant="h6" mt={4} mb={2}>سجل المبيعات</Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>اسم الدواء</TableCell>
            <TableCell>الكمية</TableCell>
            <TableCell>البائع</TableCell>
            <TableCell>تاريخ البيع</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map(sale => (
            <TableRow key={sale._id}>
              <TableCell>{sale.medicineId?.name}</TableCell>
              <TableCell>{sale.quantitySold}</TableCell>
              <TableCell>{sale.sellerName}</TableCell>
              <TableCell>{new Date(sale.saleDate).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default SellerSales;
