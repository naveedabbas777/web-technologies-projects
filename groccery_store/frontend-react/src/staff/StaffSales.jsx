import React from 'react';
import AdminSales from '../admin/AdminSales.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';

export default function StaffSales() {
  return <AdminSales SidebarComponent={StaffSidebar} />;
}
