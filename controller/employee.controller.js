const asyncHandler = require("express-async-handler")
const Employee = require("../models/Employee")
const { EmployeeProtected } = require("../middleware/Protected")
const { Upload } = require("../utils/upload")
const cloudinary = require("../utils/cloudinary.config")
const { checkEmpty } = require("../utils/checkEmpty")
const Leave = require("../models/Leave")
const Attendence = require("../models/Attendence")
const { IO } = require("../socket/socket")
const colors = require("colors")


// Get Employee Profile
exports.GetEmployeeProfile = asyncHandler(async (req, res) => {
    const result = await Employee.findOne({ _id: req.user })
    res.json({ message: "Employee Fetch Sucess", result })
})
// Update Employee Profile
exports.UpdateEmployeeProfile = asyncHandler(async (req, res) => {
    Upload(req, res, async err => {
        if (err) {
            console.log(err)
            return res.status(400).json({ message: "Multer Error" })
        }
        const { id } = req.params
        try {
            const documents = {}
            for (const key in req.files) {
                if (key === "expletter" || key === "other") {
                    if (!documents[key]) {
                        documents[key] = []
                    }
                    const uploadAllImagesPromise = []
                    for (const item of req.files[key]) {
                        uploadAllImagesPromise.push(cloudinary.uploader.upload(item.path))
                    }
                    const allData = await Promise.all(uploadAllImagesPromise)
                    documents[key] = allData.map(item => item.secure_url)
                } else {
                    const { secure_url } = await cloudinary.uploader.upload(req.files[key][0].path)
                    documents[key] = secure_url
                }
            }
            console.log(req.body)
            let jobHistory
            if (typeof (req.body.company) === "string") {
                jobHistory = {
                    compony: req.body.company,
                    joindate: req.body.joindate,
                    resigndate: req.body.resigndate,
                    jobrole: req.body.jobrole,
                    tech: req.body.tech.split(","),
                }
            } else {
                jobHistory = req.body.company && req.body.company.map((item, index) => ({
                    compony: item,
                    joindate: req.body.joindate[index],
                    resigndate: req.body.resigndate[index],
                    jobrole: req.body.jobrole[index],
                    tech: req.body.tech[index].split(","),
                }))
            }
            await Employee.findByIdAndUpdate({ _id: id }, {
                gender: req.body.gender,
                dob: req.body.dob,
                department: req.body.department,
                documents: {
                    photo: documents["photo"],
                    resume: documents["resume"],
                    expletter: documents["expletter"],
                    other: documents["other"]
                },
                jobHistory: jobHistory,
                isExpirence: req.body.isExpirence
            })
            res.status(200).json({ massage: "Employee profile update success" })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: "Error updating Employeee profile" });
        }
    })
})
// Leave Request Send 
exports.LeaveRequestSend = asyncHandler(async (req, res) => {
    const { reason, fromDate, dayofLeave } = req.body
    const { isError, error } = checkEmpty({ reason, fromDate, dayofLeave })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required.", error })
    }
    await Leave.create({ reason: reason, fromDate: fromDate, dayofLeave, userId: req.user })
    const updatedResult = await Leave.find()
    IO.emit("send-employee-leave", updatedResult)
    res.json({ message: "Leave Request Send Success" })
})
// Fetch Employee Request 
exports.fetchEmployeeRequest = asyncHandler(async (req, res) => {
    const result = await Leave.find({ userId: req.user })
    let EmployeeRequst = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        EmployeeRequst.push(await employee.populate("userId"))
    }
    if (!result) {
        return res.json({ message: "No Data Found" })
    }
    res.json({ message: "Leave Request Send Success", result: EmployeeRequst })
})
// Fetch Late Employee Data
exports.LateEmpData = asyncHandler(async (req, res) => {
    try {
        const result = await Attendence.aggregate([
            { $sort: { date: 1, checkIn: 1 } },
            {
                $group: {
                    _id: { date: "$date", userId: "$userId" },
                    firstLogin: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$firstLogin" } }
        ]);
        const populatedResult = await Attendence.populate(result, { path: "userId" });

        const lateHrData = populatedResult.filter(employee =>
            employee.userId._id == req.user &&
            employee.isLate === true &&
            employee.checkInType === "Login"
        )
        res.json({ message: "Late Employee Fetch Success", result: lateHrData });
    } catch (error) {
        console.error(colors.bgRed(error))
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});