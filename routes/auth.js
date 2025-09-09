const express = require("express")
const { signUp, signIn } = require("../controllers/auth")

const router = express.Router()

router.post("/user/sign-up", signUp)
router.post("/user/sign-in", signIn)

module.exports = router