// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: String, required: true },
  date: { type: Date, required: true }, // Apenas date, que inclui data e hora
}, {
  timestamps: true
});

module.exports = mongoose.model("Appointment", appointmentSchema);