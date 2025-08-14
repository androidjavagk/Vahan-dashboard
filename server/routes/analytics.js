const express = require('express');
const router = express.Router();
const moment = require('moment');
const { getVahanData } = require('./data');

// Calculate YoY (Year-over-Year) growth
router.get('/yoy', (req, res) => {
  const { vehicle_type, manufacturer, fuel_type } = req.query;
  
  let vehicles = [...getVahanData()]; // Create a copy of the data

  // Apply filters
  if (vehicle_type && vehicle_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.vehicle_type === vehicle_type);
  }
  if (manufacturer && manufacturer.trim() !== '') {
    vehicles = vehicles.filter(v => v.manufacturer === manufacturer);
  }
  if (fuel_type && fuel_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.fuel_type === fuel_type);
  }

  // Group by year, vehicle_type, manufacturer
  const yearlyData = {};
  vehicles.forEach(vehicle => {
    const year = moment(vehicle.registration_date).format('YYYY');
    const key = `${year}-${vehicle.vehicle_type}-${vehicle.manufacturer}`;
    
    if (!yearlyData[key]) {
      yearlyData[key] = {
        year: year,
        vehicle_type: vehicle.vehicle_type,
        manufacturer: vehicle.manufacturer,
        total_vehicles: 0,
        total_registrations: 0
      };
    }
    
    // Use the count field for actual vehicle count, default to 1 if not available
    const vehicleCount = vehicle.count || 1;
    yearlyData[key].total_vehicles += vehicleCount;
    yearlyData[key].total_registrations += 1;
  });

  // Calculate YoY growth
  const yoyData = calculateYoYGrowth(Object.values(yearlyData));
  res.json(yoyData);
});

// Calculate QoQ (Quarter-over-Quarter) growth
router.get('/qoq', (req, res) => {
  const { vehicle_type, manufacturer, fuel_type, year } = req.query;
  
  let vehicles = [...getVahanData()]; // Create a copy of the data

  // Apply filters
  if (vehicle_type && vehicle_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.vehicle_type === vehicle_type);
  }
  if (manufacturer && manufacturer.trim() !== '') {
    vehicles = vehicles.filter(v => v.manufacturer === manufacturer);
  }
  if (fuel_type && fuel_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.fuel_type === fuel_type);
  }
  if (year && year.trim() !== '') {
    vehicles = vehicles.filter(v => moment(v.registration_date).format('YYYY') === year);
  }

  // Group by quarter, vehicle_type, manufacturer
  const quarterlyData = {};
  vehicles.forEach(vehicle => {
    const quarter = moment(vehicle.registration_date).format('YYYY-[Q]Q');
    const key = `${quarter}-${vehicle.vehicle_type}-${vehicle.manufacturer}`;
    
    if (!quarterlyData[key]) {
      quarterlyData[key] = {
        year: moment(vehicle.registration_date).format('YYYY'),
        quarter: moment(vehicle.registration_date).format('Q'),
        vehicle_type: vehicle.vehicle_type,
        manufacturer: vehicle.manufacturer,
        total_vehicles: 0,
        total_registrations: 0
      };
    }
    
    // Use the count field for actual vehicle count, default to 1 if not available
    const vehicleCount = vehicle.count || 1;
    quarterlyData[key].total_vehicles += vehicleCount;
    quarterlyData[key].total_registrations += 1;
  });

  // Calculate QoQ growth
  const qoqData = calculateQoQGrowth(Object.values(quarterlyData));
  res.json(qoqData);
});

// Get trend data for charts
router.get('/trends', (req, res) => {
  const { vehicle_type, manufacturer, period = 'monthly', start_date, end_date } = req.query;
  
  let vehicles = [...getVahanData()]; // Create a copy of the data

  // Apply filters
  if (vehicle_type && vehicle_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.vehicle_type === vehicle_type);
  }
  if (manufacturer && manufacturer.trim() !== '') {
    vehicles = vehicles.filter(v => v.manufacturer === manufacturer);
  }
  if (start_date && start_date.trim() !== '') {
    vehicles = vehicles.filter(v => {
      const vehicleDate = new Date(v.registration_date);
      const filterDate = new Date(start_date);
      return vehicleDate >= filterDate;
    });
  }
  if (end_date && end_date.trim() !== '') {
    vehicles = vehicles.filter(v => {
      const vehicleDate = new Date(v.registration_date);
      const filterDate = new Date(end_date);
      return vehicleDate <= filterDate;
    });
  }

  // Group by period
  const trendData = {};
  vehicles.forEach(vehicle => {
    let periodKey;
    if (period === 'daily') {
      periodKey = moment(vehicle.registration_date).format('YYYY-MM-DD');
    } else if (period === 'weekly') {
      periodKey = moment(vehicle.registration_date).format('YYYY-[W]WW');
    } else {
      periodKey = moment(vehicle.registration_date).format('YYYY-MM');
    }
    
    const key = `${periodKey}-${vehicle.vehicle_type}-${vehicle.manufacturer}`;
    
    if (!trendData[key]) {
      trendData[key] = {
        period: periodKey,
        vehicle_type: vehicle.vehicle_type,
        manufacturer: vehicle.manufacturer,
        total_vehicles: 0,
        total_registrations: 0
      };
    }
    
    // Use the count field for actual vehicle count, default to 1 if not available
    const vehicleCount = vehicle.count || 1;
    trendData[key].total_vehicles += vehicleCount;
    trendData[key].total_registrations += 1;
  });

  res.json(Object.values(trendData).sort((a, b) => a.period.localeCompare(b.period)));
});

// Get market share analysis
router.get('/market-share', (req, res) => {
  const { start_date, end_date, vehicle_type } = req.query;
  
  let vehicles = [...getVahanData()]; // Create a copy of the data

  // Apply filters
  if (start_date && start_date.trim() !== '') {
    vehicles = vehicles.filter(v => {
      const vehicleDate = new Date(v.registration_date);
      const filterDate = new Date(start_date);
      return vehicleDate >= filterDate;
    });
  }
  if (end_date && end_date.trim() !== '') {
    vehicles = vehicles.filter(v => {
      const vehicleDate = new Date(v.registration_date);
      const filterDate = new Date(end_date);
      return vehicleDate <= filterDate;
    });
  }
  if (vehicle_type && vehicle_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.vehicle_type === vehicle_type);
  }

  // Calculate total vehicles for market share
  const totalVehicles = vehicles.reduce((sum, v) => sum + (v.count || 1), 0);

  // Group by manufacturer and vehicle_type
  const marketShareData = {};
  vehicles.forEach(vehicle => {
    const key = `${vehicle.manufacturer}-${vehicle.vehicle_type}`;
    
    if (!marketShareData[key]) {
      marketShareData[key] = {
        manufacturer: vehicle.manufacturer,
        vehicle_type: vehicle.vehicle_type,
        total_vehicles: 0,
        total_registrations: 0,
        market_share_percentage: 0
      };
    }
    
    // Use the count field for actual vehicle count, default to 1 if not available
    const vehicleCount = vehicle.count || 1;
    marketShareData[key].total_vehicles += vehicleCount;
    marketShareData[key].total_registrations += 1;
  });

  // Calculate market share percentages
  Object.values(marketShareData).forEach(item => {
    item.market_share_percentage = totalVehicles > 0 ? 
      Math.round((item.total_vehicles / totalVehicles) * 10000) / 100 : 0;
  });

  res.json(Object.values(marketShareData).sort((a, b) => b.total_vehicles - a.total_vehicles));
});

// Helper function to calculate YoY growth
const calculateYoYGrowth = (data) => {
  const grouped = {};
  
  // Group data by vehicle type and manufacturer
  data.forEach(row => {
    const key = `${row.vehicle_type}-${row.manufacturer}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(row);
  });

  const result = [];
  
  Object.keys(grouped).forEach(key => {
    const entries = grouped[key].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Calculate YoY growth for consecutive years
    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];
      
      // Calculate growth percentage
      const growth = previous.total_vehicles > 0 ? 
        ((current.total_vehicles - previous.total_vehicles) / previous.total_vehicles) * 100 : 0;
      
      result.push({
        vehicle_type: current.vehicle_type,
        manufacturer: current.manufacturer,
        current_year: current.year,
        previous_year: previous.year,
        current_vehicles: current.total_vehicles,
        previous_vehicles: previous.total_vehicles,
        growth_percentage: Math.round(growth * 100) / 100,
        growth_type: growth >= 0 ? 'positive' : 'negative',
        absolute_change: current.total_vehicles - previous.total_vehicles
      });
    }
  });

  // Sort by absolute growth percentage (highest first)
  return result.sort((a, b) => Math.abs(b.growth_percentage) - Math.abs(a.growth_percentage));
};

// Helper function to calculate QoQ growth
const calculateQoQGrowth = (data) => {
  const grouped = {};
  
  // Group data by vehicle type, manufacturer, and year
  data.forEach(row => {
    const key = `${row.vehicle_type}-${row.manufacturer}-${row.year}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(row);
  });

  const result = [];
  
  Object.keys(grouped).forEach(key => {
    const entries = grouped[key].sort((a, b) => {
      const quarterOrder = { '1': 1, '2': 2, '3': 3, '4': 4 };
      return quarterOrder[a.quarter] - quarterOrder[b.quarter];
    });
    
    // Calculate QoQ growth for consecutive quarters
    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];
      
      // Calculate growth percentage
      const growth = previous.total_vehicles > 0 ? 
        ((current.total_vehicles - previous.total_vehicles) / previous.total_vehicles) * 100 : 0;
      
      result.push({
        vehicle_type: current.vehicle_type,
        manufacturer: current.manufacturer,
        year: current.year,
        current_quarter: current.quarter,
        previous_quarter: previous.quarter,
        current_vehicles: current.total_vehicles,
        previous_vehicles: previous.total_vehicles,
        growth_percentage: Math.round(growth * 100) / 100,
        growth_type: growth >= 0 ? 'positive' : 'negative',
        absolute_change: current.total_vehicles - previous.total_vehicles
      });
    }
  });

  // Sort by absolute growth percentage (highest first)
  return result.sort((a, b) => Math.abs(b.growth_percentage) - Math.abs(a.growth_percentage));
};

module.exports = router;
