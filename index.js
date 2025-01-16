const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const colors = require("colors")
const path = require("path")
const { app, httpServer } = require("./socket/socket")
require("dotenv").config({ path: "./.env" })

app.use(cors({
    origin: process.env.NODE_ENV === "development"
        ? process.env.LOCAL_SERVER
        : process.env.LIVE_SERVER,
    credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.static("dist"))

app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/employee", require("./routes/employee.routes"))
app.use("/api/admin", require("./routes/admin.routes"))
app.use("/api/hr", require("./routes/hr.routes"))
app.use("/api/teamlead", require("./routes/teamLead.routes"))

app.use("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"))
})
app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).json({ message: "SERVER ERROR", error: err.message })
})
mongoose.connect(process.env.MONGO_URL)
mongoose.connection.once("open", () => {
    console.log(colors.bgBlue("MONGO CONNECTED🔗"))
    httpServer.listen(process.env.PORT, console.log(colors.bgMagenta("SERVER RUNNING🏃‍♂️")))
})