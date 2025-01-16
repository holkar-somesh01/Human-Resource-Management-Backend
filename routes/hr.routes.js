const router = require("express").Router()
const { EmployeeProtected, HRProtected } = require("../middleware/Protected")
const HRController = require("./../controller/hr.controller")

router
    // Find Employee
    .get("/find-employee", HRController.findserchemployee)
    // Fetch Employee Leave Request
    .get("/fetch-request", HRProtected, HRController.fetchEmployeeLeaveRequest)
    // Fetch TeamLead Leave Request
    .get("/fetch-teamlead-request", HRProtected, HRController.fetchTeamLeadLeaveRequest)
    // Update  Leave Request
    .put("/update-leave/:id", HRController.updateLeaveRequest)
    //  Fetch Employee's
    .get("/fetch-employee", HRProtected, HRController.fetchEmployee)
    //  Fetch TeamLead's
    .get("/fetch-teamlead", HRProtected, HRController.fetchTeamLead)
    //  Fetch  Employee Attendence
    .get("/employee-attendence-fetch", HRController.EmployeeAttendenceFetch)
    //  Fetch TeamLead Attendence
    .get("/teamlead-attendence-fetch", HRController.TeamLeadAttendenceFetch)
    //  Fetch HR Profile
    .get("/fetch-hr-profile", HRProtected, HRController.FetchHRProfile)
    //  Update  HR Profile
    .put("/update-hr-profile/:id", HRProtected, HRController.UpdateHrProfile)
    //  Send HR's Leave 
    .post("/leave-request-hr", HRProtected, HRController.SendLeaveRequest)
    //  Fetch HR's Leave 
    .get("/fetch-request-status", HRProtected, HRController.FetchRequestStatus)
    //  Handle Search
    .post("/handle-search-hr", HRProtected, HRController.handleSearch)
    //  Late Employee Data
    .get("/late-hr-data", HRProtected, HRController.LateHRData)

module.exports = router