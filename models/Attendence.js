const mongoose = require("mongoose")

const attendenceSchema = new mongoose.Schema({
    checkIn: { type: String, },
    checkOut: { type: String, },
    checkInType: { type: String, enum: ["Login", "Logout"], default: "Login" },
    workTime: { type: String },
    date: { type: String, required: true },
    isLate: { type: Boolean, default: false },
    absent: { type: Boolean, default: false },
    userId: { type: mongoose.Types.ObjectId, ref: "employee" },
}, { timestamps: true })

module.exports = mongoose.model("attendence", attendenceSchema)