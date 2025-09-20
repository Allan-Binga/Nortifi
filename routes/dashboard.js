const express = require("express")
const { fetchDashboard } = require("../controllers/dashboard")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.get("/my-dashboard", authUser, fetchDashboard)

module.exports = router