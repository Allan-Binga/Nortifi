const express = require("express")
const { verifyEmail } = require("../controllers/verfiication")

const router = express.Router()

router.get("/verify/email", verifyEmail)

module.exports = router