import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle">
          <Menu size={20} />
        </button>
        <div className="page-title">
          <h1>Vehicle Registration Analytics</h1>
          <p>Comprehensive insights for investment decisions</p>
        </div>
      </div>
      
      <div className="header-right">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search vehicles, manufacturers..." 
            className="search-input"
          />
        </div>
        
        <div className="header-actions">
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
          
          <div className="user-menu">
            <button className="user-btn">
              <User size={20} />
              <span>Investor</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
