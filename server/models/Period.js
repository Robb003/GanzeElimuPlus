const mongoose = require('mongoose');

const PeriodSchema = new mongoose.Schema({
  cycleName: { 
    type: String, 
    required: true, 
    default: "Ganze NG-CDF Bursary Cycle 2026/2027" 
  },
  openingDate: { 
    type: Date, 
    required: true 
  },
  closingDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Period', PeriodSchema);
