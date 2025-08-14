import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import DataManagement from './components/DataManagement';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create Filter Context
const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

function App() {
  const [currentFilters, setCurrentFilters] = useState({
    startDate: '2023-01-01',
    endDate: new Date().toISOString().split('T')[0],
    vehicleType: '',
    manufacturer: ''
  });

  return (
    <QueryClientProvider client={queryClient}>
      <FilterContext.Provider value={{ currentFilters, setCurrentFilters }}>
        <Router>
          <div className="app">
            <Sidebar />
            <div className="main-content">
              <Header />
              <main className="content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/data" element={<DataManagement />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </FilterContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
