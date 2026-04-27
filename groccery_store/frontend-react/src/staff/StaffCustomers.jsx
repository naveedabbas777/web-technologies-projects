import React from 'react';
import AdminCustomers from '../admin/AdminCustomers.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';

export default function StaffCustomers() {
  return <AdminCustomers SidebarComponent={StaffSidebar} readOnly />;
}
