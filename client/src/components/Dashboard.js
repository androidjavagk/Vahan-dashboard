import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Car, 
  Users, 
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import apiClient from '../config/axios';
import { useFilters } from '../App';

const Dashboard = () => {
  const { currentFilters, setCurrentFilters } = useFilters();

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/vehicles/filters');
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', currentFilters],
    queryFn: async () => {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        start_date: currentFilters.startDate,
        end_date: currentFilters.endDate,
        vehicle_type: currentFilters.vehicleType,
        manufacturer: currentFilters.manufacturer
      };
      
      const [stats, trends, marketShare] = await Promise.all([
        apiClient.get('/api/vehicles/stats', { params: backendFilters }),
        apiClient.get('/api/analytics/trends', { params: { ...backendFilters, period: 'monthly' } }),
        apiClient.get('/api/analytics/market-share', { params: backendFilters })
      ]);
      
      return {
        stats: stats.data,
        trends: trends.data,
        marketShare: marketShare.data
      };
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // KPI Cards
  const KPICard = ({ title, value, change, icon, color }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {change && (
              <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                {change >= 0 ? '+' : ''}{change}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  // Filter Component
  const FilterSection = () => (
    <div className="card mb-6">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <h3 className="card-title">Filters</h3>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={currentFilters.startDate}
              onChange={(e) => setCurrentFilters({ ...currentFilters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={currentFilters.endDate}
              onChange={(e) => setCurrentFilters({ ...currentFilters, endDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select
              className="form-select"
              value={currentFilters.vehicleType}
              onChange={(e) => setCurrentFilters({ ...currentFilters, vehicleType: e.target.value })}
            >
              <option value="">All Types</option>
              {filterOptions?.vehicle_types?.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer</label>
            <select
              className="form-select"
              value={currentFilters.manufacturer}
              onChange={(e) => setCurrentFilters({ ...currentFilters, manufacturer: e.target.value })}
            >
              <option value="">All Manufacturers</option>
              {filterOptions?.manufacturers?.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading dashboard data</p>
        <button 
          className="btn btn-primary mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats || [];
  const trends = dashboardData?.trends || [];
  const marketShare = dashboardData?.marketShare || [];

  // Calculate KPIs
  const totalVehicles = stats.reduce((sum, item) => sum + (item.total_vehicles || 0), 0);
  const totalRegistrations = stats.reduce((sum, item) => sum + (item.total_registrations || 0), 0);
  const uniqueManufacturers = new Set(stats.map(item => item.manufacturer)).size;

  // Prepare chart data
  const trendData = trends.slice(0, 12).reverse().map(item => ({
    month: item.period,
    vehicles: item.total_vehicles,
    registrations: item.total_registrations
  }));

  const marketShareData = marketShare.slice(0, 8).map(item => ({
    name: item.manufacturer,
    value: item.total_vehicles,
    percentage: item.market_share_percentage
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  return (
    <div className="dashboard">
      <FilterSection />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title="Total Vehicles"
          value={totalVehicles.toLocaleString()}
          change={12.5}
          icon={<Car size={24} className="text-white" />}
          color="bg-blue-500"
        />
        <KPICard
          title="Total Registrations"
          value={totalRegistrations.toLocaleString()}
          change={8.2}
          icon={<Calendar size={24} className="text-white" />}
          color="bg-green-500"
        />
        <KPICard
          title="Manufacturers"
          value={uniqueManufacturers}
          change={-2.1}
          icon={<Users size={24} className="text-white" />}
          color="bg-purple-500"
        />
        <KPICard
          title="Market Growth"
          value="15.3%"
          change={15.3}
          icon={<TrendingUp size={24} className="text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Registration Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registration Trends</h3>
            <p className="card-subtitle">Monthly vehicle registration trends</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="vehicles" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Vehicles"
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Registrations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Share */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Market Share</h3>
            <p className="card-subtitle">Top manufacturers by market share</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marketShareData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {marketShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vehicle Type Distribution */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Vehicle Type Distribution</h3>
          <p className="card-subtitle">Registration breakdown by vehicle type</p>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle_type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_vehicles" fill="#3b82f6" name="Total Vehicles" />
              <Bar dataKey="total_registrations" fill="#10b981" name="Total Registrations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Registrations</h3>
          <p className="card-subtitle">Latest vehicle registration activity</p>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle Type</th>
                  <th>Manufacturer</th>
                  <th>Model</th>
                  <th>Fuel Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${item.vehicle_type === '2W' ? 'info' : item.vehicle_type === '3W' ? 'warning' : 'success'}`}>
                        {item.vehicle_type}
                      </span>
                    </td>
                    <td>{item.manufacturer}</td>
                    <td>{item.manufacturer} Model</td>
                    <td>{item.fuel_type}</td>
                    <td>{item.total_vehicles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
