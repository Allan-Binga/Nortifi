const express = require("express")
const { signUp, signIn, signOut, validateSession } = require("../controllers/auth")

const router = express.Router()

router.post("/user/sign-up", signUp)
router.post("/user/sign-in", signIn)
router.get("/user/validate", validateSession)
router.post("/user/sign-out", signOut)

module.exports = router