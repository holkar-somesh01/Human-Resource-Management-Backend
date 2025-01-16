const router = require("express").Router()
const { adminProtected } = require("../middleware/Protected")
const AdminController = require("./../controller/admin.controller")

router
    // Handle Search
    .post("/handle-search-admin", adminProtected, AdminController.handleSearch)
    // Fetch Hr's Leave 
    .get("/fetch-hr-leave", adminProtected, AdminController.fetchHRLeaveRequest)
    // Find HR's
    .get("/fetch-hr", adminProtected, AdminController.FindHrs)
    // Fetch Late Employee
    .get("/fetch-late-employee", adminProtected, AdminController.FetchLateEmployee)
    // Fetch Absent Hr 
    .get("/fetch-absent-employee", adminProtected, AdminController.FetchAbsentEmployee)
    // update Hr Leave
    .put("/update-hr-leave/:id", adminProtected, AdminController.UpdateHrLeave)
    // Late Employee's Fetch
    .get("/admin-late-employee", AdminController.AdminLateEmployee)
    // Absent Employee's Fetch
    .post("/admin-absent-employee", AdminController.absentEmployee)

    .get("/fetch-employee", AdminController.fetchEmployee)
    //  Fetch TeamLead's
    .get("/fetch-teamlead", AdminController.fetchTeamLead)

module.exports = router