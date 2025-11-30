import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

import AdminSidebar from './components/Dashboard/AdminSidebar';
import PharmacistSidebar from './components/Dashboard/PharmacistSidebar';
import SellerSidebar from './components/Dashboard/SellerSidebar';

import Login from './components/Auth/Login';

// استيراد جميع المكونات الحقيقية
import AdminUsersManagement from './pages/AdminUsersManagement';
import AdminMedicines from './pages/AdminMedicines';
import AdminSales from './pages/AdminSales';
import Stock from './pages/Stock';
import Inventory from './pages/Inventory';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import Backup from './pages/Backup';
import Branches from './pages/Branches';
import ReturnsAndDamaged from './pages/ReturnsAndDamaged';

import PharmacistDashboard from './pages/PharmacistDashboard';
import SellerDashboard from './pages/SellerDashboard';

// المكونات الجديدة لنظام البيع المتكامل
import SellerMedicinesList from './pages/SellerMedicinesList';
import SellerCategories from './pages/SellerCategories';
import SellerSearch from './pages/SellerSearch';
import SellerInvoices from './pages/SellerInvoices';
import SalesManagement from './pages/SalesManagement';

// Layout يعرض Sidebar بالقائمة اليسرى ومحتوى تفرعي (Outlet)
const Layout = ({ sidebar }) => (
  <div style={{ display: 'flex', height: '100vh' }}>
    {sidebar}
    <main style={{ flexGrow: 1, overflowY: 'auto', padding: 16 }}>
      <Outlet />
    </main>
  </div>
);

function AppRoutes() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <Routes>
        <Route path="/*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* دور الادمن */}
      {user.role === 'admin' && (
        <Route element={<Layout sidebar={<AdminSidebar />} />}>
          <Route path="/" element={<Navigate to="/users" />} />
          <Route path="/users" element={<AdminUsersManagement />} />
          <Route path="/medicines" element={<AdminMedicines />} />
          <Route path="/sales" element={<AdminSales />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/returns" element={<ReturnsAndDamaged />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/invoices" element={<SellerInvoices />} />
          <Route path="/sales-management" element={<SalesManagement />} />
          <Route path="*" element={<Navigate to="/users" />} />
        </Route>
      )}

      {/* دور الصيدلي */}
      {user.role === 'pharmacist' && (
        <Route element={<Layout sidebar={<PharmacistSidebar />} />}>
          <Route path="/" element={<Navigate to="/pharmacist/medicines" />} />
          <Route path="/pharmacist/medicines" element={<AdminMedicines />} />
          <Route path="/pharmacist/stock" element={<Stock />} />
          <Route path="/pharmacist/returns" element={<ReturnsAndDamaged />} />
          <Route path="/pharmacist/notifications" element={<Notifications />} />
          <Route path="/pharmacist/sales-management" element={<SalesManagement />} />
          <Route path="*" element={<Navigate to="/pharmacist/medicines" />} />
        </Route>
      )}

      {/* دور البائع */}
      {user.role === 'seller' && (
        <Route element={<Layout sidebar={<SellerSidebar />} />}>
          <Route path="/" element={<Navigate to="/seller/dashboard" />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/medicines" element={<SellerMedicinesList />} />
          <Route path="/seller/categories" element={<SellerCategories />} />
          <Route path="/seller/search" element={<SellerSearch />} />
          <Route path="/seller/stock" element={<Stock />} />
          <Route path="/seller/sales-management" element={<SalesManagement />} />
          <Route path="/seller/invoices" element={<SellerInvoices />} />
          <Route path="/seller/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/seller/dashboard" />} />
        </Route>
      )}

      {/* توجيه افتراضي */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
