const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema({
    reason: { type: String, },
    fromDate: { type: String, },
    dayofLeave: { type: Number },
    userId: { type: mongoose.Types.ObjectId, ref: "employee" },
    leave: { type: String, enum: ["pending", "reject", "accept"], default: "pending" },
})

module.exports = mongoose.model("leave", leaveSchema)