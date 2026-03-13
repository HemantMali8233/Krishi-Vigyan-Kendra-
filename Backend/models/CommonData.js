const mongoose = require('mongoose');

const CommonDataSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  values: [{ type: String, unique: true }]
});

module.exports = mongoose.model('CommonData', CommonDataSchema);
