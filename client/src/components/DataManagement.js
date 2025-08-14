import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  FileText,
  Settings,
  Play,
  Filter
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFilters } from '../App';

const DataManagement = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const queryClient = useQueryClient();
  const { currentFilters } = useFilters();

  // Fetch data status
  const { data: dataStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['dataStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/data/status');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch filtered data statistics
  const { data: filteredStats, isLoading: filteredStatsLoading } = useQuery({
    queryKey: ['filteredStats', currentFilters],
    queryFn: async () => {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        start_date: currentFilters.startDate,
        end_date: currentFilters.endDate,
        vehicle_type: currentFilters.vehicleType,
        manufacturer: currentFilters.manufacturer
      };
      
      const response = await axios.get('/api/vehicles/stats', { params: backendFilters });
      return response.data;
    },
    enabled: !!dataStatus?.data_status?.total_records // Only run if we have data
  });

  // Calculate filtered statistics
  const getFilteredStats = () => {
    if (!filteredStats || filteredStats.length === 0) {
      return {
        totalRecords: 0,
        uniqueManufacturers: 0,
        uniqueVehicleTypes: 0,
        earliestDate: null,
        latestDate: null
      };
    }

    const totalRecords = filteredStats.reduce((sum, item) => sum + (item.total_vehicles || 0), 0);
    const uniqueManufacturers = new Set(filteredStats.map(item => item.manufacturer)).size;
    const uniqueVehicleTypes = new Set(filteredStats.map(item => item.vehicle_type)).size;
    
    // Get date range from filtered data
    const allDates = filteredStats.flatMap(item => [
      item.first_registration,
      item.last_registration
    ]).filter(date => date);
    
    const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => new Date(d)))) : null;
    const latestDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => new Date(d)))) : null;

    return {
      totalRecords,
      uniqueManufacturers,
      uniqueVehicleTypes,
      earliestDate,
      latestDate
    };
  };

  const filteredStatsData = getFilteredStats();

  // Initialize data mutation
  const initializeMutation = useMutation({
    mutationFn: async () => {
      setIsInitializing(true);
      const response = await axios.post('/api/data/init');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Data initialized successfully!');
      queryClient.invalidateQueries({ queryKey: ['dataStatus'] });
      queryClient.invalidateQueries({ queryKey: ['filteredStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => {
      toast.error('Failed to initialize data: ' + (error.response?.data?.error || error.message));
    },
    onSettled: () => {
      setIsInitializing(false);
    }
  });

  // Test data generation mutation
  const testDataMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/data/test-init');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Test data generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['dataStatus'] });
      queryClient.invalidateQueries({ queryKey: ['filteredStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => {
      toast.error('Failed to generate test data: ' + (error.response?.data?.error || error.message));
    }
  });

  // Export data function with filters
  const exportData = async (format = 'json') => {
    try {
      // Convert frontend filter names to backend expected names
      const backendFilters = {
        start_date: currentFilters.startDate,
        end_date: currentFilters.endDate,
        vehicle_type: currentFilters.vehicleType,
        manufacturer: currentFilters.manufacturer
      };
      
      // Build query string with filters
      const queryParams = new URLSearchParams();
      Object.entries(backendFilters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value);
        }
      });
      queryParams.append('format', format);
      
      const url = `/api/data/export?${queryParams.toString()}`;
      
      if (format === 'json') {
        // For JSON, fetch the data and create a download
        const response = await axios.get(url);
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url2 = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url2;
        link.download = `vehicle_data_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url2);
      } else if (format === 'csv') {
        // For CSV, fetch the data and create a download
        const response = await axios.get(url, {
          responseType: 'text',
          headers: {
            'Accept': 'text/csv'
          }
        });
        const dataBlob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url2 = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url2;
        link.download = `vehicle_data_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url2);
      }
      
      // Show filter info in success message
      const filterInfo = [];
      if (currentFilters.startDate) filterInfo.push(`From: ${currentFilters.startDate}`);
      if (currentFilters.endDate) filterInfo.push(`To: ${currentFilters.endDate}`);
      if (currentFilters.vehicleType) filterInfo.push(`Type: ${currentFilters.vehicleType}`);
      if (currentFilters.manufacturer) filterInfo.push(`Manufacturer: ${currentFilters.manufacturer}`);
      
      const filterText = filterInfo.length > 0 ? ` (${filterInfo.join(', ')})` : ' (All data)';
      toast.success(`Data exported as ${format.toUpperCase()}${filterText}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${format.toUpperCase()}: ${error.response?.data?.error || error.message}`);
    }
  };

  // Status Card Component
  const StatusCard = ({ title, value, icon, color = 'blue' }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Action Card Component
  const ActionCard = ({ title, description, icon, action, loading = false, disabled = false }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="card-title text-lg">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <button
              onClick={action}
              disabled={disabled || loading}
              className={`btn ${loading ? 'btn-loading' : 'btn-primary'}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                title
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-600">Manage and export vehicle registration data</p>
        </div>
        <button
          onClick={() => refetchStatus()}
          className="btn btn-secondary"
          disabled={statusLoading}
        >
          <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Data Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Records"
          value={filteredStatsData.totalRecords || 0}
          icon={<Database className="w-5 h-5" />}
          color="blue"
        />
        <StatusCard
          title="Manufacturers"
          value={filteredStatsData.uniqueManufacturers || 0}
          icon={<Settings className="w-5 h-5" />}
          color="green"
        />
        <StatusCard
          title="Vehicle Types"
          value={filteredStatsData.uniqueVehicleTypes || 0}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
        />
        <StatusCard
          title="Last Updated"
          value={dataStatus?.last_updated ? new Date(dataStatus.last_updated).toLocaleDateString() : 'Never'}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Filter Indicator */}
      {(currentFilters.startDate || currentFilters.endDate || currentFilters.vehicleType || currentFilters.manufacturer) && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <h3 className="card-title">Active Filters</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              {currentFilters.startDate && (
                <span className="badge badge-info">From: {currentFilters.startDate}</span>
              )}
              {currentFilters.endDate && (
                <span className="badge badge-info">To: {currentFilters.endDate}</span>
              )}
              {currentFilters.vehicleType && (
                <span className="badge badge-warning">Type: {currentFilters.vehicleType}</span>
              )}
              {currentFilters.manufacturer && (
                <span className="badge badge-success">Manufacturer: {currentFilters.manufacturer}</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Showing filtered data based on Dashboard selections. 
              {filteredStatsData.totalRecords > 0 
                ? ` Found ${filteredStatsData.totalRecords} records.`
                : ' No records match the current filters.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Data Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionCard
          title="Initialize Data"
          description="Generate realistic mock data for demonstration purposes. This will create 500 vehicle records with various manufacturers and vehicle types."
          icon={<Play className="w-5 h-5" />}
          action={() => initializeMutation.mutate()}
          loading={isInitializing}
        />

        <ActionCard
          title="Generate Test Data"
          description="Quickly generate test data for development and testing. This will replace any existing data with fresh test records."
          icon={<CheckCircle className="w-5 h-5" />}
          action={() => testDataMutation.mutate()}
          loading={testDataMutation.isPending}
        />
      </div>

      {/* Export Options */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <h3 className="card-title">Export Data</h3>
          </div>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            Export your vehicle registration data in various formats for external analysis.
            {filteredStatsData.totalRecords > 0 && (
              <span className="text-green-600 font-medium"> Exporting {filteredStatsData.totalRecords} filtered records.</span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => exportData('json')}
              className="btn btn-secondary"
              disabled={!filteredStatsData.totalRecords}
            >
              <FileText className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="btn btn-secondary"
              disabled={!filteredStatsData.totalRecords}
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="card-title">Data Source Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Source:</span>
              <span className="font-medium">{dataStatus?.data_source || 'No data available'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date Range:</span>
              <span className="font-medium">
                {filteredStatsData.earliestDate && filteredStatsData.latestDate
                  ? `${filteredStatsData.earliestDate.toLocaleDateString()} to ${filteredStatsData.latestDate.toLocaleDateString()}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">
                {dataStatus?.last_updated 
                  ? new Date(dataStatus.last_updated).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
