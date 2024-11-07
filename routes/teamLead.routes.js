const router = require("express").Router()
const { teamLeadProtected } = require("../middleware/Protected")
const teamLeadController = require("./../controller/teamLead.controller")

router
    // TeamLEad Fetch Profile
    .get("/fetch-teamLead-profile", teamLeadProtected, teamLeadController.teamLeadFetchProfile)
    // Update TeamLead Profile
    .put("/update-teamLead-profile/:id", teamLeadProtected, teamLeadController.UpdateTeamLeadProfile)
    // Handle Search
    .get("/handle-search-teamLead", teamLeadProtected, teamLeadController.handleSearch)
    // Fetch TeamLead request
    .get("/fetch-teamLead-request", teamLeadProtected, teamLeadController.fetchTeamleadRequest)
    // Send TeamLead Laave request
    .post("/leave-request-teamlead", teamLeadProtected, teamLeadController.LeaveRequestSend)
    // Late TeamLead Data
    .get("/late-team-data", teamLeadProtected, teamLeadController.LateTeamData)

module.exports = router