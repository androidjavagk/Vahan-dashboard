const express = require('express');
const router = express.Router();
const { getVahanData } = require('./data');

// Get all vehicles with filters
router.get('/', (req, res) => {
  const { 
    vehicle_type, 
    manufacturer, 
    start_date, 
    end_date, 
    fuel_type,
    limit = 100,
    offset = 0 
  } = req.query;

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
  if (fuel_type && fuel_type.trim() !== '') {
    vehicles = vehicles.filter(v => v.fuel_type === fuel_type);
  }

  // Apply pagination
  vehicles = vehicles.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json(vehicles);
});

// Get vehicle statistics
router.get('/stats', (req, res) => {
  const { start_date, end_date, vehicle_type, manufacturer } = req.query;

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
  if (manufacturer && manufacturer.trim() !== '') {
    vehicles = vehicles.filter(v => v.manufacturer === manufacturer);
  }

  // Group by vehicle_type, manufacturer, fuel_type
  const stats = {};
  vehicles.forEach(vehicle => {
    const key = `${vehicle.vehicle_type}-${vehicle.manufacturer}-${vehicle.fuel_type}`;
    if (!stats[key]) {
      stats[key] = {
        vehicle_type: vehicle.vehicle_type,
        manufacturer: vehicle.manufacturer,
        fuel_type: vehicle.fuel_type,
        total_registrations: 0,
        total_vehicles: 0,
        first_registration: vehicle.registration_date,
        last_registration: vehicle.registration_date
      };
    }
    
    // Use the count field for actual vehicle count, default to 1 if not available
    const vehicleCount = vehicle.count || 1;
    stats[key].total_registrations += 1;
    stats[key].total_vehicles += vehicleCount;
    
    if (vehicle.registration_date < stats[key].first_registration) {
      stats[key].first_registration = vehicle.registration_date;
    }
    if (vehicle.registration_date > stats[key].last_registration) {
      stats[key].last_registration = vehicle.registration_date;
    }
  });

  res.json(Object.values(stats).sort((a, b) => b.total_vehicles - a.total_vehicles));
});

// Get unique values for filters
router.get('/filters', (req, res) => {
  const vehicles = [...getVahanData()]; // Create a copy of the data
  
  const vehicle_types = [...new Set(vehicles.map(v => v.vehicle_type))].sort();
  const manufacturers = [...new Set(vehicles.map(v => v.manufacturer))].sort();
  const fuel_types = [...new Set(vehicles.map(v => v.fuel_type))].sort();
  
  res.json({
    vehicle_types,
    manufacturers,
    fuel_types
  });
});

module.exports = router;
