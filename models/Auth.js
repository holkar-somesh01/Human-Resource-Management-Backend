const mongoose = require("mongoose")

const authSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    mobile: { type: String },
    role: { type: String, default: "admin" },
}, { timestamps: true })

module.exports = mongoose.model("auth", authSchema) 