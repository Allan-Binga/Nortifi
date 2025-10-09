const express = require("express")
const { registerSMTPServer, getSMTPServers, getSMPTConfiguration, updateSMPTConfigurationDetails, deleteSMTPServer, getSingleSMTPServer } = require("../controllers/smtp")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.post("/server/register", authUser, registerSMTPServer)
router.get("/all/servers/website/:websiteId", authUser, getSMTPServers)
router.get("/all/servers/server/:smtpServerId", authUser, getSMPTConfiguration)
router.patch("/server/update/:smptServerId", authUser, updateSMPTConfigurationDetails)
router.delete("/server/delete/:smtpServerId", authUser, deleteSMTPServer)

module.exports = router