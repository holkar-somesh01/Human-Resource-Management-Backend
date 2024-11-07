const authController = require("../controller/auth.controller")
const { adminProtected, HRProtected, EmployeeProtected } = require("../middleware/Protected")
const router = require("express").Router()

router
    //  Admin Register
    .post("/register-admin", authController.registerAdmin)
    // Login Admin
    .post("/login-admin", authController.loginAdmin)
    // Logout Admin
    .post("/logout-admin", authController.logoutAdmin)

    // ADD HR 
    .post("/add-hr", adminProtected, authController.addHR)
    //  Add Employee
    .post("/add-employee", HRProtected, authController.addEmployee)

    // Login HR 
    .post("/login-hr", authController.loginHR)
    // Login Manager
    .post("/login-manager", authController.loginManager)
    // Login teamLead
    .post("/login-teamLead", authController.loginTeamLead)
    // Login employee
    .post("/login-employee", authController.loginEmployee)


    // LogOut hr
    .put("/logout-hr/:id", authController.logoutHR)
    // LogOut manger
    .post("/logout-manager", authController.logoutManager)
    // LogOut TeamLead
    .put("/logout-teamLead/:id", authController.logoutTeamLead)
    // LogOut Employee
    .put("/logout-employee/:id", authController.logoutEmployee)

module.exports = router