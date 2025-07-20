const Bus = require('../models/Bus');

const resetBusLocation = async (busId) => {
  await Bus.findByIdAndUpdate(busId, {
    currentLocation: 'Depot',
    nextStop: null,
    status: 'maintenance',
    currentDirection: 'departure',
    attendanceData: null,
    'currentPassengers.students': 0,
    'currentPassengers.others': 0,
    lastUpdated: new Date()
  });
};

module.exports = { resetBusLocation };