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

import { 
  Person as PersonIcon,
  Medication as MedicationIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
  AccountBalance as AccountBalanceIcon,
  Backup as BackupIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Logout as LogoutIcon,
  AssignmentReturn as AssignmentReturnIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'إدارة المستخدمين', path: '/users', icon: PersonIcon },
  { text: 'إدارة الأدوية', path: '/medicines', icon: MedicationIcon },
  { text: 'إدارة المبيعات', path: '/sales', icon: PointOfSaleIcon },
  { text: 'المخزون', path: '/stock', icon: InventoryIcon },
  { text: 'نظام الجرد', path: '/inventory', icon: AssessmentIcon },
  { text: 'المسترجع والتالف', path: '/returns', icon: AssignmentReturnIcon },
  { text: 'التنبيهات والاشعارات', path: '/notifications', icon: NotificationsIcon },
  { text: 'التقارير والتحليلات', path: '/reports', icon: BarChartIcon },
  { text: 'الإدارة المالية', path: '/finance', icon: AccountBalanceIcon },
  { text: 'النسخ الاحتياطي واستعادة البيانات', path: '/backup', icon: BackupIcon },
  { text: 'إدارة الفروع', path: '/branches', icon: StoreIcon },
  { text: 'قائمة الفواتير', path: '/invoices', icon: ReceiptIcon },
];

const AdminSidebar = () => {
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
      <Toolbar sx={{ backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          صيدلية إسلام - لوحة الأدمن
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* معلومات المستخدم */}
      <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="body2" fontWeight="bold" color="primary">
          👤 {user?.username}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({user?.role === 'admin' ? 'مدير النظام' : user?.role})
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
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              },
              '&:hover': {
                backgroundColor: '#e3f2fd',
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

export default AdminSidebar;