import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box,
  Button
} from '@mui/material';

import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MedicationIcon from '@mui/icons-material/Medication';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'لوحة البيع', path: '/seller/dashboard', icon: PointOfSaleIcon },
  { text: 'قائمة الأدوية', path: '/seller/medicines', icon: MedicationIcon },
  { text: 'الأدوية حسب التصنيف', path: '/seller/categories', icon: CategoryIcon },
  { text: 'بحث بالأدوية', path: '/seller/search', icon: SearchIcon },
  { text: 'المخزون', path: '/seller/stock', icon: InventoryIcon },
  { text: 'إدارة المبيعات', path: '/seller/sales-management', icon: ReceiptIcon },
  { text: 'قائمة الفواتير', path: '/seller/invoices', icon: ReceiptIcon },
  { text: 'التنبيهات', path: '/seller/notifications', icon: NotificationsIcon },
];

const SellerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column'
        },
      }}
    >
      <Toolbar sx={{ backgroundColor: '#2e7d32', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          صيدلية إسلام - لوحة البائع
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* معلومات المستخدم */}
      <Box sx={{ p: 2, bgcolor: '#e8f5e8', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="body2" fontWeight="bold" color="#2e7d32">
          👤 {user?.username}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({user?.role === 'seller' ? 'بائع' : user?.role})
        </Typography>
      </Box>

      {/* القائمة الرئيسية */}
      <List sx={{ py: 1, flexGrow: 1 }}>
        {menuItems.map(({ text, path, icon: Icon }, index) => (
          <ListItemButton 
            key={index} 
            onClick={() => navigate(path)}
            selected={location.pathname === path}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: '#2e7d32',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              },
              '&:hover': {
                backgroundColor: '#e8f5e8',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 45 }}>
              <Icon />
            </ListItemIcon>
            <ListItemText 
              primary={text} 
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: location.pathname === path ? 'bold' : 'normal'
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* زر تسجيل الخروج */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: 'flex-start',
            py: 1.5,
            fontWeight: 'bold'
          }}
        >
          تسجيل الخروج
        </Button>
      </Box>
    </Drawer>
  );
};

export default SellerSidebar;