const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now }, 
  Mistakes: String,
  WPM: String,
  CMP: String,
  id: String,
});

const DataModel = mongoose.models.GameData || mongoose.model('GameData', DataSchema);

module.exports = DataModel;
