import React from 'react';
import AdminProducts from '../admin/AdminProducts.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';

export default function StaffProducts() {
  return <AdminProducts SidebarComponent={StaffSidebar} />;
}
