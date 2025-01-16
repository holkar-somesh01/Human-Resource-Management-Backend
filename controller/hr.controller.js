const expressAsyncHandler = require("express-async-handler")
const Employee = require("../models/Employee")
const cloudinary = require("../utils/cloudinary.config")
const { Upload } = require("../utils/upload")
const Leave = require("../models/Leave")
const sendEmail = require("../utils/email")
const Attendence = require("../models/Attendence")
const { checkEmpty } = require("../utils/checkEmpty")
const excel = require("excel4node")
const path = require("path")
const { IO } = require("../socket/socket")

// Fetch Employee Leave Request
exports.fetchEmployeeLeaveRequest = expressAsyncHandler(async (req, res) => {
    const result = await Leave.find()
    let EmployeeLeaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        EmployeeLeaveRequest.push(await employee.populate("userId"))
    }
    let employee = []
    for (let i = 0; i < EmployeeLeaveRequest.length; i++) {
        if (EmployeeLeaveRequest[i].userId.role === "employee") {
            employee.push(EmployeeLeaveRequest[i])
        }
    }
    res.json({ message: "Leave Requests Fetch Success", result: employee })
})
// Fetch TeamLead Leave Request
exports.fetchTeamLeadLeaveRequest = expressAsyncHandler(async (req, res) => {
    const result = await Leave.find()
    let TeamLeadRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]

        TeamLeadRequest.push(await employee.populate("userId"))
    }
    let TeamLead = []

    for (let i = 0; i < TeamLeadRequest.length; i++) {
        if (TeamLeadRequest[i].userId.role === "teamLead") {
            TeamLead.push(TeamLeadRequest[i])
        }
    }
    res.json({ message: "TeamLead Requests Fetch Success", result: TeamLead })
})
//Find Search Employee
exports.findserchemployee = expressAsyncHandler(async (req, res) => {
    const { search } = req.body
    const result = await Employee.find(
        { $or: [{ department: search }, { status: search }, { online: search },] }
    );
    res.status(200).json({ message: "employee search success", result })
})
// Update Leave Request
exports.updateLeaveRequest = expressAsyncHandler(async (req, res) => {
    const { leave, dayofLeave } = req.body
    const { id } = req.params
    const isFound = await Leave.findOne({ _id: id })
    if (isFound.leave === "accept") {
        return res.status(400).json({ message: "Leave Already Accepted" })
    }
    if (isFound.leave === "reject") {
        return res.status(400).json({ message: "Leave Already Rejected" })
    }
    let countLeave = 0
    let unPaidLeave = 0
    let isOnLeave
    const result = await isFound.populate("userId")
    if (leave === "accept") {
        if (result.userId.annual <= 0) {
            await sendEmail({
                to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave count In Unpaid Leaves.</p>`
            })
            unPaidLeave = +result.unpaidLeaves + dayofLeave
            if (!countLeave) {
                countLeave = result.userId.unpaidLeaves + dayofLeave
                unPaidLeave = Math.abs(countLeave)
            } else {
                unPaidLeave = Math.abs(countLeave)
                if (countLeave <= 0) {
                    countLeave = 0
                }
            }
        } else {
            if (result.userId.annual >= dayofLeave) {
                countLeave = result.userId.annual - dayofLeave
            } else {
                countLeave = result.userId.annual - dayofLeave
                unPaidLeave = Math.abs(countLeave)
                if (countLeave <= 0) {
                    countLeave = 0
                }
            }
        }
        isOnLeave = true
        await Employee.findByIdAndUpdate(result.userId._id, { annual: countLeave, isOnLeave: isOnLeave, unpaidLeaves: unPaidLeave })
    } else {
        await sendEmail({
            to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave Is Rejected By HR.</p>`
        })
    }
    await Leave.findByIdAndUpdate(id, { leave })
    const updatedResult = await Leave.find()
    IO.emit("updateLeaveRequest", updatedResult)
    res.json({ message: "Leave Update Success" })
})
// Fetch Employee
exports.fetchEmployee = expressAsyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "employee", userId: req.user })
    res.json({ message: "Employee Fetch Success", result })
})
// Fetch TeamLead
exports.fetchTeamLead = expressAsyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "teamLead", userId: req.user })
    res.json({ message: "TeamLead Fetch Success", result })
})
// Employee Attendece Fetch  
exports.EmployeeAttendenceFetch = expressAsyncHandler(async (req, res) => {
    const result = await Attendence.find()
    let EmployeeAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        EmployeeAtt.push(await attendence.populate("userId"))
    }
    let EmpAttendence = []
    for (let i = 0; i < EmployeeAtt.length; i++) {
        if (EmployeeAtt[i].userId.role === "employee") {
            EmpAttendence.push(EmployeeAtt[i])
        }
    }
    res.json({ message: "Employee Attendence fetch Success", result: EmpAttendence })
})
// TeamLead Attendence Fetch 
exports.TeamLeadAttendenceFetch = expressAsyncHandler(async (req, res) => {
    const result = await Attendence.find()
    let teamLeadAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        teamLeadAtt.push(await attendence.populate("userId"))
    }
    let teamAttendence = []
    for (let i = 0; i < teamLeadAtt.length; i++) {
        if (teamLeadAtt[i].userId.role === "teamLead") {
            teamAttendence.push(teamLeadAtt[i])
        }
    }
    res.json({ message: "TeamLead Attendence fetch Success", result: teamAttendence })
})
// Fetch HR Profile 
exports.FetchHRProfile = expressAsyncHandler(async (req, res) => {
    const result = await Employee.find({ _id: req.user })
    res.json({ message: "HR Profile Fetched", result })
})
//Update HR Profile 
exports.UpdateHrProfile = expressAsyncHandler(async (req, res) => {
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
                jobHistory: jobHistory
            })
            res.status(200).json({ massage: "HR profile update success" })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: "Error updating HR profile" });
        }

    })

})
// Send Leave Request 
exports.SendLeaveRequest = expressAsyncHandler(async (req, res) => {
    const { reason, fromDate, dayofLeave } = req.body
    const { isError, error } = checkEmpty({ reason, fromDate, dayofLeave })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required.", error })
    }
    await Leave.create({ reason: reason, fromDate: fromDate, dayofLeave, userId: req.user })
    const updatedResult = await Leave.find()
    IO.emit("SendLeaveRequest", updatedResult)
    res.json({ message: "Leave Request Send Success" })
})
// Fetch Reques Status
exports.FetchRequestStatus = expressAsyncHandler(async (req, res) => {
    const result = await Leave.find({ userId: req.user })
    let hrleaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        hrleaveRequest.push(await employee.populate("userId"))
    }
    if (!result) {
        return res.json({ message: "No Data Found" })
    }
    res.json({ message: "Leave Request Send Success", result: hrleaveRequest })

})
// Handle Search 
exports.handleSearch = expressAsyncHandler(async (req, res) => {
    const { search } = req.body
    const result = await Employee.find({
        $or: [{ department: search }, { role: search }, { status: search }]
    })
    res.json({ messsage: "Search Successfully", result })
})
// Employee Attendence Excel
exports.EmpAttendenceExcel = expressAsyncHandler(async (req, res) => {
    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet("Employee Attendence")
    const result = await Attendence.find()
    let EmployeeAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        EmployeeAtt.push(await attendence.populate("userId"))
    }
    let EmpAttendence = []
    for (let i = 0; i < EmployeeAtt.length; i++) {
        if (EmployeeAtt[i].userId.role === "employee") {
            EmpAttendence.push(EmployeeAtt[i])
        }
    }
    const x = EmpAttendence.map(item => [item.checkIn, item.checkOut && item.checkOut, item.date, item.isLate ? "Late" : "onTime", item.absent ? "Absent" : "Present", item.userId.name, item.userId.email])
    const Data = [
        ["CheckIn", "CheckOut", "Date", "IsLate", "Absent", "Name", "Email"],
    ]
    for (let i = 0; i < x.length; i++) {
        Data.push(x[i])
    }
    Data.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            worksheet.cell(rowIndex + 1, cellIndex + 1).string(cell.toString())
        })
    })
    const fn = Date.now() + path.extname("EmployeeAttendence.xlsx")
    const filePath = path.join(__dirname, "..", 'excelSheet', fn);
    workbook.write(filePath, (err, status) => {
        if (err) {
            console.log(err)
        }
        res.json({ message: "Attendence Excel Sheet Create Success" })
    })
})
// Late HR Data
exports.LateHRData = expressAsyncHandler(async (req, res) => {
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

        console.log(result, "Aggregated data...");

        const populatedResult = await Attendence.populate(result, { path: "userId" });

        const lateHrData = populatedResult.filter(employee =>
            employee.userId.role === "hr" &&
            employee.isLate === true &&
            employee.checkInType === "Login"
        );

        console.log(lateHrData);

        res.json({ message: "Late HR Fetch Success", result: lateHrData });
    } catch (error) {
        console.error("Error fetching late HR data:", error);
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});

