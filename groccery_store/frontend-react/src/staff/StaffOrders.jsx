import React from 'react';
import AdminOrders from '../admin/AdminOrders.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';

export default function StaffOrders() {
  return <AdminOrders SidebarComponent={StaffSidebar} />;
}
