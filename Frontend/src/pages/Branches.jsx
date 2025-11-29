import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [editId, setEditId] = useState(null);

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/branches');
      setBranches(data);
    } catch (error) {
      console.error('خطأ في جلب الفروع:', error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpen = (branch = null) => {
    if (branch) {
      setForm({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
      });
      setEditId(branch._id);
    } else {
      setForm({
        name: '',
        address: '',
        phone: '',
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      name: '',
      address: '',
      phone: '',
    });
    setEditId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/branches/${editId}`, form);
      } else {
        await axios.post('http://localhost:5000/api/branches', form);
      }
      fetchBranches();
      handleClose();
    } catch (error) {
      console.error('خطأ في حفظ الفرع:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل تريد حذف هذا الفرع؟')) {
      try {
        await axios.delete(`http://localhost:5000/api/branches/${id}`);
        fetchBranches();
      } catch (error) {
        console.error('خطأ في حذف الفرع:', error);
      }
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        إدارة الفروع
      </Typography>
      <Button variant="contained" onClick={() => handleOpen()}>
        إضافة فرع جديد
      </Button>

      <Table sx={{ marginTop: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>اسم الفرع</TableCell>
            <TableCell>العنوان</TableCell>
            <TableCell>هاتف الفرع</TableCell>
            <TableCell>إجراءات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch._id}>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.address}</TableCell>
              <TableCell>{branch.phone}</TableCell>
              <TableCell>
                <Button variant="outlined" size="small" onClick={() => handleOpen(branch)} sx={{ mr: 1 }}>
                  تعديل
                </Button>
                <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(branch._id)}>
                  حذف
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
        <DialogContent>
          <TextField
            label="اسم الفرع"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="العنوان"
            fullWidth
            margin="normal"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextField
            label="هاتف الفرع"
            fullWidth
            margin="normal"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editId ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Branches;