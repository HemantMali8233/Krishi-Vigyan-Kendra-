const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
  contactPerson: { type: String, required: true },
  designation: { type: String },
  discipline: { type: String },
  email: { type: String },
  mobile: { type: String },
  landline: { type: String },
});

const DataEntrySchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  eventType: { type: String, required: true },
  eventCategory: { type: String, required: true },
  eventName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  venuePlace: { type: String, required: true },
  venueTal: { type: String },
  venueDist: { type: String },
  objectives: { type: String },
  aboutEvent: { type: String },
  targetGroup: { type: String, required: true },
  contacts: [ContactPersonSchema],
  chiefGuestCategory: { type: String },
  chiefGuest: { type: String },
  chiefGuestRemark: { type: String },
  postEventDetails: { type: String },
  genMale: { type: Number, default: 0 },
  genFemale: { type: Number, default: 0 },
  scMale: { type: Number, default: 0 },
  scFemale: { type: Number, default: 0 },
  stMale: { type: Number, default: 0 },
  stFemale: { type: Number, default: 0 },
  otherMale: { type: Number, default: 0 },
  otherFemale: { type: Number, default: 0 },
  efMale: { type: Number, default: 0 },
  efFemale: { type: Number, default: 0 },
  mediaCoverage: { type: String, required: true },
  discipline: [{ type: String, required: true }],
  sourceModule: { type: String }, // To track which module created this entry
  createdByName: { type: String }, // To store the creator's name
}, { timestamps: true });

module.exports = mongoose.model('DataEntry', DataEntrySchema);
