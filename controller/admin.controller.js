const asyncHandler = require("express-async-handler")
const Employee = require("../models/Employee")
const Leave = require("../models/Leave")
const sendEmail = require("../utils/email")
const Attendence = require("../models/Attendence")
const { IO } = require("../socket/socket")

//Search
exports.handleSearch = asyncHandler(async (req, res) => {
    const { search } = req.body
    const result = await Employee.find({
        $or: [{ department: search }, { jobtitle: search }, { status: search }]
    })
    res.json({ messsage: "Search Successfully", result })
})
// Fetch HR Leave Request
exports.fetchHRLeaveRequest = asyncHandler(async (req, res) => {
    const result = await Leave.find()
    let EmployeeLeaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        EmployeeLeaveRequest.push(await employee.populate("userId"))
    }
    let employee = []
    for (let i = 0; i < EmployeeLeaveRequest.length; i++) {
        if (EmployeeLeaveRequest[i].userId.role === "hr") {
            employee.push(EmployeeLeaveRequest[i])
        }
    }
    res.json({ message: "Leave Requests Fetch Success", result: employee })
})
// Find HRS
exports.FindHrs = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "hr" })
    res.json({ message: "Fetch Success", result })
})

// Fetch Employee
exports.fetchEmployee = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "employee", })
    res.json({ message: "Fetch Admin Employee  Success", result })
})
// Fetch TeamLead
exports.fetchTeamLead = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "teamLead", })
    res.json({ message: "Fetch Admin TeamLead  Success", result })
})
// Update HR Leave
exports.UpdateHrLeave = asyncHandler(async (req, res) => {
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
    } else {
        await sendEmail({
            to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave Is Rejected By HR.</p>`
        })
    }
    await Leave.findByIdAndUpdate(id, { leave, })
    await Employee.findByIdAndUpdate(result.userId._id, { annual: countLeave, isOnLeave: isOnLeave, unpaidLeaves: unPaidLeave })
    const updatedResult = await Leave.find()
    IO.emit("leave-update", updatedResult)
    res.json({ message: "Leave Update Success" })
})
// Fetch Late Employee
exports.FetchLateEmployee = asyncHandler(async (req, res) => {
    const result = await Attendence.find()

    let late = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        late.push(await attendence.populate("userId"))
    }
    let lateEmployee = []
    for (let i = 0; i < late.length; i++) {
        if (late[i].isLate === true) {
            lateEmployee.push(late[i])
        }
    }
    res.json({ message: "Late Employee Fetched", result: lateEmployee })
})
//Fetch Absent Employee
exports.FetchAbsentEmployee = asyncHandler(async (req, res) => {
    const result = await Attendence.find()
    let absent = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        absent.push(await attendence.populate("userId"))
    }
    let absentEmployee = []
    for (let i = 0; i < absent.length; i++) {
        if (absent[i].absent === true) {
            absentEmployee.push(absent[i])
        }
    }
    res.json({ message: "Absent Employee Fetched", result: absentEmployee })
})
// Absend Employess 
exports.absentEmployee = asyncHandler(async (req, res) => {
    const attendanceRecords = await Attendence.find();
    const monthstart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    let populatedRecords = [];
    for (let i = 0; i < attendanceRecords.length; i++) {
        const record = attendanceRecords[i];
        populatedRecords.push(await record.populate("userId"));
    }
    const startDate = new Date(monthstart);
    const endDate = new Date();
    const dates = [];

    for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        dates.push(currentDate.toISOString().split('T')[0]);
    }
    const employeeAttendance = {};
    for (let i = 0; i < populatedRecords.length; i++) {
        const { date, userId } = populatedRecords[i];
        const id = userId.toString();
        if (!employeeAttendance[id]) {
            employeeAttendance[id] = { userId: userId._id, name: userId.name, role: userId.role, dates: [] };
        }
        employeeAttendance[id].dates.push(date);
    }
    const absences = Object.values(employeeAttendance).map(employee => {
        const absentDates = dates.filter(date => !employee.dates.includes(date));
        return {
            userId: employee.userId,
            name: employee.name,
            role: employee.role,
            absentDates,
        };
    });

    res.json({ message: "Fetch Success", result: absences });
});
// Admin Late Employee
exports.AdminLateEmployee = asyncHandler(async (req, res) => {
    try {
        const result = await Attendence.aggregate([{
            $match: {
                isLate: true,
                checkInType: "Login"
            }
        },
        { $sort: { date: 1, checkIn: 1 } },
        {
            $group: {
                _id: { date: "$date", userId: "$userId" },
                firstLogin: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$firstLogin" } }
        ]);

        const populatedResult = await Attendence.populate(result, { path: "userId" })
        res.json({ message: "Late HR Fetch Success", result: populatedResult });
    } catch (error) {
        console.error("Error fetching late HR data:", error);
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});