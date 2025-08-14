import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Database, 
  Car, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      path: '/',
      icon: <BarChart3 size={20} />,
      label: 'Dashboard',
      description: 'Overview & KPIs'
    },
    {
      path: '/analytics',
      icon: <TrendingUp size={20} />,
      label: 'Analytics',
      description: 'YoY & QoQ Analysis'
    },
    {
      path: '/data',
      icon: <Database size={20} />,
      label: 'Data Management',
      description: 'Data Sources & Export'
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Car size={32} className="logo-icon" />
          <div className="logo-text">
            <h2>Vehicle Analytics</h2>
            <p>Registration Dashboard</p>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="nav-icon">
                  {item.icon}
                </div>
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="footer-info">
          <p className="text-sm text-gray-500">Data Source: Vahan Dashboard</p>
          <p className="text-xs text-gray-400">Last updated: Today</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
