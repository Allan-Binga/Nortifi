const express = require("express")
const { signUp, signIn, signOut } = require("../controllers/auth")

const router = express.Router()

router.post("/user/sign-up", signUp)
router.post("/user/sign-in", signIn)
router.post("/user/sign-out", signOut)

module.exports = router