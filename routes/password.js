const express = require("express")
const { resetPassword, resetUserPassword, verifyPasswordResetToken, resendPasswordReset } = require("../controllers/password")

const router = express.Router()


router.post("/send/password-reset-email", resetPassword)
router.post("/resend/password-reset-email", resendPasswordReset)
router.put("/user/reset/password", resetUserPassword)
router.get("/verify/password-reset-token", verifyPasswordResetToken)


module.exports = router