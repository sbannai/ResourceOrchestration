import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const navItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/projects', icon: '🏗', label: 'Projects' },
  { path: '/invoices', icon: '🧾', label: 'Invoices' },
  { path: '/team', icon: '👥', label: 'Team' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
];

function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏛</span>
            {!collapsed && <span className="logo-text">Construction ERP</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        {!collapsed && tenant && (
          <div className="tenant-info">
            <div className="tenant-name">{tenant.name}</div>
            <div className="tenant-plan">{tenant.plan} plan</div>
          </div>
        )}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
              <div>
                <div className="user-name">{user?.firstName} {user?.lastName}</div>
                <div className="user-role">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
