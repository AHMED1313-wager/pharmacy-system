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

import MedicationIcon from '@mui/icons-material/Medication';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { AuthContext } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'إدارة الأدوية', path: '/pharmacist/medicines', icon: MedicationIcon },
  { text: 'المخزون', path: '/pharmacist/stock', icon: InventoryIcon },
  { text: 'المسترجع والتالف', path: '/pharmacist/returns', icon: AssignmentReturnIcon },
  { text: 'إدارة المبيعات', path: '/pharmacist/sales-management', icon: ReceiptIcon },
  { text: 'التنبيهات', path: '/pharmacist/notifications', icon: NotificationsIcon },
];

const PharmacistSidebar = () => {
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
      <Toolbar sx={{ backgroundColor: '#ed6c02', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          صيدلية إسلام - لوحة الصيدلي
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* معلومات المستخدم */}
      <Box sx={{ p: 2, bgcolor: '#fff3e0', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="body2" fontWeight="bold" color="#ed6c02">
          👤 {user?.username}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({user?.role === 'pharmacist' ? 'صيدلي' : user?.role})
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
                backgroundColor: '#ed6c02',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#e65100',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              },
              '&:hover': {
                backgroundColor: '#fff3e0',
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

export default PharmacistSidebar;