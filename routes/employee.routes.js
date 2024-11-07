const router = require("express").Router()
const { EmployeeProtected, } = require("../middleware/Protected")
const EmployeeController = require("./../controller/employee.controller")

router
    // Get Employee Profile
    .get("/fetch-employee-profile", EmployeeProtected, EmployeeController.GetEmployeeProfile)
    // update  Employee Profile
    .put("/update-employee-profile/:id", EmployeeProtected, EmployeeController.UpdateEmployeeProfile)
    // Send Employee Leave 
    .post("/employee-leave-request", EmployeeProtected, EmployeeController.LeaveRequestSend)
    // Fetch Employee Leave 
    .get("/fetch-employee-leave-request", EmployeeProtected, EmployeeController.fetchEmployeeRequest)
    // Late Employee Data
    .get("/late-emp-data", EmployeeProtected, EmployeeController.LateEmpData)

module.exports = router