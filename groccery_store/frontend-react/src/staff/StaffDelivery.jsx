import React from 'react';
import AdminDelivery from '../admin/AdminDelivery.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';

export default function StaffDelivery() {
  return <AdminDelivery SidebarComponent={StaffSidebar} />;
}
