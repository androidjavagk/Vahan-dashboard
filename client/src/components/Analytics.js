import React, { useState } from 'react';
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
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import axios from 'axios';
import { useFilters } from '../App';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('yoy');
  const { currentFilters, setCurrentFilters } = useFilters();
  
  // Use the shared filters but add analytics-specific ones
  const [analyticsFilters, setAnalyticsFilters] = useState({
    vehicleType: currentFilters.vehicleType || '',
    manufacturer: currentFilters.manufacturer || '',
    fuelType: '',
    year: new Date().getFullYear().toString()
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const response = await axios.get('/api/vehicles/filters');
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch YoY data
  const { data: yoyData, isLoading: yoyLoading } = useQuery({
    queryKey: ['yoy', analyticsFilters],
    queryFn: async () => {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        vehicle_type: analyticsFilters.vehicleType,
        manufacturer: analyticsFilters.manufacturer,
        fuel_type: analyticsFilters.fuelType,
        year: analyticsFilters.year
      };
      const response = await axios.get('/api/analytics/yoy', { params: backendFilters });
      return response.data;
    }
  });

  // Fetch QoQ data
  const { data: qoqData, isLoading: qoqLoading } = useQuery({
    queryKey: ['qoq', analyticsFilters],
    queryFn: async () => {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        vehicle_type: analyticsFilters.vehicleType,
        manufacturer: analyticsFilters.manufacturer,
        fuel_type: analyticsFilters.fuelType,
        year: analyticsFilters.year
      };
      const response = await axios.get('/api/analytics/qoq', { params: backendFilters });
      return response.data;
    }
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['trends', analyticsFilters],
    queryFn: async () => {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        vehicle_type: analyticsFilters.vehicleType,
        manufacturer: analyticsFilters.manufacturer,
        fuel_type: analyticsFilters.fuelType,
        year: analyticsFilters.year
      };
      const response = await axios.get('/api/analytics/trends', { 
        params: { ...backendFilters, period: 'monthly' } 
      });
      return response.data;
    }
  });

  const isLoading = yoyLoading || qoqLoading || trendLoading;

  // Growth Card Component
  const GrowthCard = ({ title, value, change, type, icon }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <div className="flex items-center gap-2 mt-2">
              {icon}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">vs {type}</span>
            </div>
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
          <h3 className="card-title">Analysis Filters</h3>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select
              className="form-select"
              value={analyticsFilters.vehicleType}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, vehicleType: e.target.value })}
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
              value={analyticsFilters.manufacturer}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, manufacturer: e.target.value })}
            >
              <option value="">All Manufacturers</option>
              {filterOptions?.manufacturers?.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <select
              className="form-select"
              value={analyticsFilters.fuelType}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, fuelType: e.target.value })}
            >
              <option value="">All Fuels</option>
              {filterOptions?.fuel_types?.map((fuel) => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <select
              className="form-select"
              value={analyticsFilters.year}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, year: e.target.value })}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
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
        <span>Loading analytics data...</span>
      </div>
    );
  }

  // Calculate summary statistics
  const yoySummary = yoyData?.reduce((acc, item) => {
    acc.totalGrowth += item.growth_percentage;
    acc.positiveCount += item.growth_percentage >= 0 ? 1 : 0;
    acc.negativeCount += item.growth_percentage < 0 ? 1 : 0;
    return acc;
  }, { totalGrowth: 0, positiveCount: 0, negativeCount: 0 }) || { totalGrowth: 0, positiveCount: 0, negativeCount: 0 };

  const qoqSummary = qoqData?.reduce((acc, item) => {
    acc.totalGrowth += item.growth_percentage;
    acc.positiveCount += item.growth_percentage >= 0 ? 1 : 0;
    acc.negativeCount += item.growth_percentage < 0 ? 1 : 0;
    return acc;
  }, { totalGrowth: 0, positiveCount: 0, negativeCount: 0 }) || { totalGrowth: 0, positiveCount: 0, negativeCount: 0 };

  const avgYoYGrowth = yoyData?.length ? (yoySummary.totalGrowth / yoyData.length).toFixed(1) : 0;
  const avgQoQGrowth = qoqData?.length ? (qoqSummary.totalGrowth / qoqData.length).toFixed(1) : 0;

  return (
    <div className="analytics">
      <FilterSection />

      {/* Tab Navigation */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'yoy' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('yoy')}
              >
                Year-over-Year (YoY)
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'qoq' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('qoq')}
              >
                Quarter-over-Quarter (QoQ)
              </button>
            </div>
            <button className="btn btn-secondary btn-sm">
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <GrowthCard
          title="Average YoY Growth"
          value={`${avgYoYGrowth}%`}
          change={parseFloat(avgYoYGrowth)}
          type="previous year"
          icon={parseFloat(avgYoYGrowth) >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
        />
        <GrowthCard
          title="Average QoQ Growth"
          value={`${avgQoQGrowth}%`}
          change={parseFloat(avgQoQGrowth)}
          type="previous quarter"
          icon={parseFloat(avgQoQGrowth) >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
        />
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Growth Distribution</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'yoy' ? yoySummary.positiveCount : qoqSummary.positiveCount} / {activeTab === 'yoy' ? yoyData?.length || 0 : qoqData?.length || 0}
                </h3>
                <p className="text-sm text-green-600 mt-1">Positive Growth</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Analysis Chart */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">
            {activeTab === 'yoy' ? 'Year-over-Year Growth Analysis' : 'Quarter-over-Quarter Growth Analysis'}
          </h3>
          <p className="card-subtitle">
            {activeTab === 'yoy' 
              ? 'Growth comparison between consecutive years' 
              : 'Growth comparison between consecutive quarters'
            }
          </p>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={activeTab === 'yoy' ? yoyData?.slice(0, 20) : qoqData?.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={activeTab === 'yoy' ? 'manufacturer' : 'manufacturer'} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`, 
                  name === 'growth_percentage' ? 'Growth %' : name
                ]}
              />
              <Legend />
              <Bar 
                dataKey="growth_percentage" 
                fill={(entry) => entry.growth_percentage >= 0 ? '#10b981' : '#ef4444'}
                name="Growth Percentage"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Registration Trend Analysis</h3>
          <p className="card-subtitle">Monthly registration trends with growth indicators</p>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trendData?.slice(0, 12).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total_vehicles" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                stroke="#3b82f6"
                name="Total Vehicles"
              />
              <Line 
                type="monotone" 
                dataKey="total_registrations" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Total Registrations"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Growth Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {activeTab === 'yoy' ? 'Year-over-Year Growth Details' : 'Quarter-over-Quarter Growth Details'}
          </h3>
          <p className="card-subtitle">Detailed breakdown of growth metrics by manufacturer and vehicle type</p>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Manufacturer</th>
                  <th>Vehicle Type</th>
                  {activeTab === 'yoy' ? (
                    <>
                      <th>Current Year</th>
                      <th>Previous Year</th>
                    </>
                  ) : (
                    <>
                      <th>Current Quarter</th>
                      <th>Previous Quarter</th>
                    </>
                  )}
                  <th>Growth %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'yoy' ? yoyData : qoqData)?.slice(0, 20).map((item, index) => (
                  <tr key={index}>
                    <td className="font-medium">{item.manufacturer}</td>
                    <td>
                      <span className={`badge badge-${item.vehicle_type === '2W' ? 'info' : item.vehicle_type === '3W' ? 'warning' : 'success'}`}>
                        {item.vehicle_type}
                      </span>
                    </td>
                    <td>{activeTab === 'yoy' ? item.current_vehicles : item.current_vehicles}</td>
                    <td>{activeTab === 'yoy' ? item.previous_vehicles : item.previous_vehicles}</td>
                    <td className={`font-semibold ${item.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.growth_percentage >= 0 ? '+' : ''}{item.growth_percentage}%
                    </td>
                    <td>
                      <span className={`badge ${item.growth_percentage >= 0 ? 'badge-success' : 'badge-danger'}`}>
                        {item.growth_percentage >= 0 ? 'Positive' : 'Negative'}
                      </span>
                    </td>
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

export default Analytics;
