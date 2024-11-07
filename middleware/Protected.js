const jwt = require("jsonwebtoken")

// ADMIN Protected
exports.adminProtected = (req, res, next) => {
    const { HRMAdmin } = req.cookies
    if (!HRMAdmin) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(HRMAdmin, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error);
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
    })
    next()
}
// HR Protected
exports.HRProtected = (req, res, next) => {
    const { HRMHR } = req.cookies
    if (!HRMHR) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(HRMHR, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error);
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
    })
    next()
}
// Manager Protected
exports.ManagerProtected = (req, res, next) => {
    const { HRMManager } = req.cookies
    if (!HRMManager) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(HRMManager, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error);
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
    })
    next()
}
// TeamLead Protected
exports.teamLeadProtected = (req, res, next) => {
    const { HRMTeamLead } = req.cookies
    if (!HRMTeamLead) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(HRMTeamLead, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error);
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
    })
    next()
}
// Employee Protected
exports.EmployeeProtected = (req, res, next) => {
    const { HRMEmployee } = req.cookies
    if (!HRMEmployee) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    // Token Verify
    jwt.verify(HRMEmployee, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error);
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userId
    })
    next()
}
