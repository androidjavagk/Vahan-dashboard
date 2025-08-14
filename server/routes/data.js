const express = require('express');
const router = express.Router();

// In-memory data storage
let vahanData = [];
let dataLastUpdated = null;

// Data access functions
const getVahanData = () => vahanData;
const setVahanData = (data) => {
  vahanData = data;
  dataLastUpdated = new Date().toISOString();
};
const getDataLastUpdated = () => dataLastUpdated;

// Initialize data (generate mock data for demonstration)
router.post('/init', async (req, res) => {
  try {
    console.log('Initializing data with mock data...');
    
    // Generate realistic mock data for demonstration
    const mockData = generateRealisticMockData();
    setVahanData(mockData);
    
    res.json({ 
      message: 'Data initialized successfully with mock data',
      records_fetched: mockData.length,
      data_source: 'Mock Data (Demo)',
      last_updated: dataLastUpdated,
      note: 'Using realistic mock data for demonstration purposes'
    });
    
  } catch (error) {
    console.error('Data initialization error:', error);
    res.status(500).json({ error: 'Data initialization failed: ' + error.message });
  }
});

// Test endpoint to quickly generate mock data
router.post('/test-init', async (req, res) => {
  try {
    console.log('Generating test mock data...');
    
    // Generate realistic mock data for demonstration
    const mockData = generateRealisticMockData();
    setVahanData(mockData);
    
    res.json({ 
      message: 'Test data generated successfully!',
      records_fetched: mockData.length,
      data_source: 'Test Mock Data',
      last_updated: dataLastUpdated,
      note: 'Dashboard should now show data in all sections'
    });
    
  } catch (error) {
    console.error('Test data generation error:', error);
    res.status(500).json({ error: 'Test data generation failed: ' + error.message });
  }
});

// Generate realistic mock data for demonstration
function generateRealisticMockData() {
  const manufacturers = [
    'Maruti Suzuki', 'Hyundai', 'Honda', 'Tata Motors', 'Mahindra',
    'Toyota', 'Kia', 'MG Motor', 'Volkswagen', 'Ford', 'Nissan',
    'Skoda', 'Renault', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo'
  ];
  
  const vehicleTypes = ['Two Wheeler', 'Three Wheeler', 'Four Wheeler', 'Commercial Vehicle'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'];
  
  const mockData = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let i = 0; i < 500; i++) {
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    
    // Generate realistic registration numbers
    const registrationNumber = `${state.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 99) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9999) + 1000}`;
    
    mockData.push({
      id: i + 1,
      registration_number: registrationNumber,
      vehicle_type: vehicleType,
      manufacturer: manufacturer,
      model: `${manufacturer} Model ${Math.floor(Math.random() * 10) + 1}`,
      fuel_type: fuelType,
      registration_date: randomDate.toISOString().split('T')[0],
      state: state,
      source: 'Mock Data (Demo)',
      fetched_at: new Date().toISOString(),
      count: Math.floor(Math.random() * 100) + 1
    });
  }
  
  return mockData;
}

// Get data collection status
router.get('/status', (req, res) => {
  try {
    const currentData = getVahanData();
    const totalRecords = currentData.length;
    const uniqueManufacturers = [...new Set(currentData.map(v => v.manufacturer))].length;
    const uniqueVehicleTypes = [...new Set(currentData.map(v => v.vehicle_type))].length;
    
    let earliestDate = null;
    let latestDate = null;
    
    if (currentData.length > 0) {
      const dates = currentData.map(v => new Date(v.registration_date));
      earliestDate = new Date(Math.min(...dates));
      latestDate = new Date(Math.max(...dates));
    }
    
    res.json({
      data_status: {
        total_records: totalRecords,
        earliest_date: earliestDate ? earliestDate.toISOString().split('T')[0] : null,
        latest_date: latestDate ? latestDate.toISOString().split('T')[0] : null,
        unique_manufacturers: uniqueManufacturers,
        unique_vehicle_types: uniqueVehicleTypes
      },
      last_updated: getDataLastUpdated() || new Date().toISOString(),
      data_source: currentData.length > 0 ? 'Mock Data (Demo)' : 'No data available'
    });
  } catch (error) {
    console.error('Error getting data status:', error);
    res.status(500).json({ error: 'Failed to get data status' });
  }
});

// Export data in various formats
router.get('/export', (req, res) => {
  try {
    const { 
      format = 'json',
      start_date,
      end_date,
      vehicle_type,
      manufacturer,
      fuel_type
    } = req.query;
    
    let currentData = [...getVahanData()]; // Create a copy of the data
    
    // Apply filters if provided
    if (start_date && start_date.trim() !== '') {
      currentData = currentData.filter(v => {
        const vehicleDate = new Date(v.registration_date);
        const filterDate = new Date(start_date);
        return vehicleDate >= filterDate;
      });
    }
    
    if (end_date && end_date.trim() !== '') {
      currentData = currentData.filter(v => {
        const vehicleDate = new Date(v.registration_date);
        const filterDate = new Date(end_date);
        return vehicleDate <= filterDate;
      });
    }
    
    if (vehicle_type && vehicle_type.trim() !== '') {
      currentData = currentData.filter(v => v.vehicle_type === vehicle_type);
    }
    
    if (manufacturer && manufacturer.trim() !== '') {
      currentData = currentData.filter(v => v.manufacturer === manufacturer);
    }
    
    if (fuel_type && fuel_type.trim() !== '') {
      currentData = currentData.filter(v => v.fuel_type === fuel_type);
    }
    
    if (currentData.length === 0) {
      return res.status(404).json({ error: 'No data available for export with the specified filters' });
    }
    
    if (format === 'csv') {
      const csv = convertToCSV(currentData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=vehicle_data_${new Date().toISOString().split('T')[0]}.csv`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=vehicle_data_${new Date().toISOString().split('T')[0]}.json`);
      res.json(currentData);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use "json" or "csv"' });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data: ' + error.message });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle different data types properly
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const escaped = value.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') || escaped.includes('\r')) {
          return `"${escaped}"`;
        }
        return escaped;
      } else {
        return String(value);
      }
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\r\n');
};

// Export the data access functions for other routes to use
module.exports = { 
  router, 
  getVahanData, 
  setVahanData, 
  getDataLastUpdated 
};
