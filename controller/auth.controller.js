const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const { checkEmpty } = require("../utils/checkEmpty")
const Auth = require("../models/Auth")
const jwt = require("jsonwebtoken")
const Employee = require("../models/Employee")
const sendEmail = require("../utils/email")
const Attendence = require("../models/Attendence")
const { IO } = require("../socket/socket")


// Admin Auth
exports.registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, mobile, role } = req.body
    const { isError, error } = checkEmpty({ name, email, password })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "Provide Strong Password" })
    }
    if (mobile && !validator.isMobilePhone(mobile, "en-IN")) {
        return res.status(400).json({ message: "Invalid Mobile Number" })
    }
    const isFound = await Auth.findOne({ email, mobile })
    if (isFound) {
        return res.status(400).json({ message: "Email OR Mobile Already registered with us" })
    }
    const hashPass = await bcrypt.hash(password, 10)
    await Auth.create({ name, email, password: hashPass, mobile, role })
    res.json({ message: "ADMIN REGISTER SUCCESS" })
})
// login Admin
exports.loginAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body
    const { error, isError } = checkEmpty({ username, password });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }
    try {
        const isFound = await Auth.findOne({ $or: [{ email: username }, { mobile: username },] });
        if (!isFound) {
            return res.status(400).json({ message: "User Email OR Mobile Not Found" });
        }
        const isVerify = await bcrypt.compare(password, isFound.password);
        if (!isVerify) {
            return res.status(400).json({ message: "Password Do Not Match" });
        }
        const token = jwt.sign({ userId: isFound._id }, process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("HRMAdmin", token, {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true
        })
        res.json({
            message: "Credentials Verify Success.",
            result: {
                _id: isFound._id,
                name: isFound.name,
                email: isFound.email,
                mobile: isFound.mobile,
                role: isFound.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
// logout Admin
exports.logoutAdmin = asyncHandler(async (req, res) => {
    res.clearCookie("HRMAdmin")
    res.json({ message: "Admin Logout Success" })
})

// HR Auth
exports.addHR = asyncHandler(async (req, res) => {
    const { name, email, mobile, role } = req.body
    const { isError, error } = checkEmpty({ name, email, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    if (mobile && !validator.isMobilePhone(mobile, "en-IN")) {
        return res.status(400).json({ message: "Invalid Mobile Number" })
    }
    const isFound = await Employee.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "Email OR Mobile Already registered with us" })
    }
    let fname = name, lmobile = mobile
    const n = fname.slice(0, 4)
    const m = lmobile.slice(-4)
    const password = n + m
    const hashPass = await bcrypt.hash(password, 10)
    await sendEmail({
        to: email, subject: `Your ID Password`, message: `<h1>Do Not share Your Account Details.</h1>
        <p>Your Id :<strong>${email}</strong> 
        </p>
        <p>Your Password :<strong>${password}</strong> 
        </p>
        `
    })
    await Employee.create({ name, email, password: hashPass, mobile, role, userId: req.user })
    const result = await Employee.find()
    IO.emit("add-hr-admin", result)
    res.json({ message: "Employee Added Success" })
})
// Login HR
exports.loginHR = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body
    const { error, isError } = checkEmpty({ username, password });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }
    try {
        const isFound = await Employee.findOne({ $or: [{ email: username }, { mobile: username },] });
        if (!isFound) {
            return res.status(400).json({ message: "User Email OR Mobile Not Found" });
        }
        if (isFound.role !== "hr") {
            return res.status(400).json({ message: "Your Role Do not Matched" });
        }
        const isVerify = await bcrypt.compare(password, isFound.password);
        if (!isVerify) {
            return res.status(400).json({ message: "Password Do Not Match" });
        }
        const token = jwt.sign({ userId: isFound._id }, process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("HRMHR", token, {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true
        })
        //Check In
        const dateT = new Date()
        dateT.toLocaleDateString()
        const TodayDate = dateT.toISOString().split('T')[0]
        const Hour = dateT.getHours()
        const Min = dateT.getMinutes()
        let isLate
        const officeTime = "10:0"
        const oficeTimexs = officeTime.split(":")
        const Time = `${Hour}:${Min}`
        const LoginTimesx = Time.split(":")
        if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
            isLate = true
        } else {
            isLate = false
        }
        await Attendence.create({ checkIn: `${Hour}:${Min}`, date: TodayDate, userId: isFound._id, isLate, checkInType: "Login" })
        res.json({
            message: "Credentials Verify Success.",
            result: {
                _id: isFound._id,
                name: isFound.name,
                email: isFound.email,
                mobile: isFound.mobile,
                role: isFound.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
// ADD EMPLOYEE
exports.addEmployee = asyncHandler(async (req, res) => {
    const { name, email, mobile, role } = req.body
    const { isError, error } = checkEmpty({ name, email, role, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    if (mobile && !validator.isMobilePhone(mobile, "en-IN")) {
        return res.status(400).json({ message: "Invalid Mobile Number" })
    }
    const isFound = await Employee.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "Email OR Mobile Already registered with us" })
    }
    let empName = name, EmpMobile = mobile

    const n = empName.slice(0, 4)
    const m = EmpMobile.slice(-4)
    const password = n + m
    const hashPass = await bcrypt.hash(password, 10)
    await sendEmail({
        to: email, subject: `Your ID Password`, message: `<h1>Do Not share Your Account Details.</h1>
        <p>Your Id :<strong>${email}</strong> 
        </p>
        <p>Your Password :<strong>${password}</strong> 
        </p>
        `
    })
    await Employee.create({ name, email, password: hashPass, mobile, role, userId: req.user })
    res.json({ message: `${role} Added Success` })
})
// Logout HR
exports.logoutHR = asyncHandler(async (req, res) => {
    const result = await Attendence.findOne({ userId: req.params.id })
    const officeTime = 10
    const date = new Date()
    date.toLocaleDateString()
    const TodayDate = date.toISOString().split('T')[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendence.create({ checkOut: `${Hour}:${Min}`, date: TodayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("HRMHR")
    res.json({ message: "HR Logout Success" })

})

// Manager Auth
exports.loginManager = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body
    const { error, isError } = checkEmpty({ username, password });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }
    try {
        const isFound = await Employee.findOne({ $or: [{ email: username }, { mobile: username },] });
        if (!isFound) {
            return res.status(400).json({ message: "User Email OR Mobile Not Found" });
        }
        if (isFound.role !== "manager") {
            return res.status(400).json({ message: "Your Role Do not Matched" });
        }
        const isVerify = await bcrypt.compare(password, isFound.password);
        if (!isVerify) {
            return res.status(400).json({ message: "Password Do Not Match" });
        }
        const token = jwt.sign({ userId: isFound._id }, process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("HRMManager", token, {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true
        })
        res.json({
            message: "Credentials Verify Success.",
            result: {
                _id: isFound._id,
                name: isFound.fname,
                email: isFound.email,
                mobile: isFound.mobile,
                role: isFound.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
exports.logoutManager = asyncHandler(async (req, res) => {
    res.clearCookie("HRMManager")
    res.json({ message: "Manager Logout Success" })
})
// TeamLead LOGIN
exports.loginTeamLead = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body
    const { error, isError } = checkEmpty({ username, password });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }
    try {
        const isFound = await Employee.findOne({ $or: [{ email: username }, { mobile: username },] });
        if (!isFound) {
            return res.status(400).json({ message: "User Email OR Mobile Not Found" });
        }
        if (isFound.role !== "teamLead") {
            return res.status(400).json({ message: "Your Role Do not Matched" });
        }
        const isVerify = await bcrypt.compare(password, isFound.password);
        if (!isVerify) {
            return res.status(400).json({ message: "Password Do Not Match" });
        }
        const token = jwt.sign({ userId: isFound._id }, process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("HRMTeamLead", token, {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true
        })
        //Check In
        const dateT = new Date()
        dateT.toLocaleDateString()
        const TodayDate = dateT.toISOString().split('T')[0]
        const Hour = dateT.getHours()
        const Min = dateT.getMinutes()
        let isLate
        const officeTime = "10:0"
        const oficeTimexs = officeTime.split(":")
        const Time = `${Hour}:${Min}`
        const LoginTimesx = Time.split(":")
        if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
            isLate = true
        } else {
            isLate = false
        }
        await Attendence.create({ checkIn: `${Hour}:${Min}`, date: TodayDate, userId: isFound._id, isLate })
        await Employee.findByIdAndUpdate(isFound._id, { userId: req.user })
        res.json({
            message: "Credentials Verify Success.",
            result: {
                _id: isFound._id,
                name: isFound.name,
                email: isFound.email,
                mobile: isFound.mobile,
                role: isFound.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
// LOGOUT TeamLead
exports.logoutTeamLead = asyncHandler(async (req, res) => {
    const result = await Attendence.findOne({ userId: req.params.id })
    // Check Out
    const officeTime = 10
    const date = new Date()
    date.toLocaleDateString()
    const TodayDate = date.toISOString().split('T')[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendence.create({ checkOut: `${Hour}:${Min}`, date: TodayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("HRMTeamLead")
    res.json({ message: "TeamLead Logout Success" })
})
// Employee Login
exports.loginEmployee = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body
    const { error, isError } = checkEmpty({ username, password });
    if (isError) {
        return res.status(400).json({ message: "All Fields Required", error });
    }
    try {
        const isFound = await Employee.findOne({ $or: [{ email: username }, { mobile: username },] })
        if (!isFound) {
            return res.status(400).json({ message: "User Email OR Mobile Not Found" });
        }
        if (isFound.role !== "employee") {
            return res.status(400).json({ message: "Your Role Do not Matched" });
        }
        const isVerify = await bcrypt.compare(password, isFound.password);
        if (!isVerify) {
            return res.status(400).json({ message: "Password Do Not Match" });
        }
        // ADD Attendence
        const dateT = new Date()
        dateT.toLocaleDateString()
        const TodayDate = dateT.toISOString().split('T')[0]
        const Hour = dateT.getHours()
        const Min = dateT.getMinutes()
        let isLate
        const officeTime = "10:0"
        const oficeTimexs = officeTime.split(":")
        const Time = `${Hour}:${Min}`
        const LoginTimesx = Time.split(":")
        if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
            isLate = true
        } else {
            isLate = false
        }
        await Attendence.create({ checkIn: `${Hour}:${Min}`, date: TodayDate, userId: isFound._id, isLate })

        const token = jwt.sign({ userId: isFound._id }, process.env.JWT_KEY, { expiresIn: "15d" })
        res.cookie("HRMEmployee", token, {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true
        })
        res.json({
            message: "Credentials Verify Success.",
            result: {
                _id: isFound._id,
                name: isFound.name,
                email: isFound.email,
                mobile: isFound.mobile,
                role: isFound.role,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})
// Employee Logout
exports.logoutEmployee = asyncHandler(async (req, res) => {
    // Check Out
    const officeTime = 10
    const date = new Date()
    date.toLocaleDateString()
    const TodayDate = date.toISOString().split('T')[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendence.create({ checkOut: `${Hour}:${Min}`, date: TodayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("HRMEmployee")
    res.json({ message: "Employee Logout Success" })
})
