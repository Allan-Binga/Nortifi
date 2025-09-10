const express = require("express");
const {
  getEmailCampaigns,
  sendEmailAWS,
  getEmails,
  unsubscribeEmail,
} = require("../controllers/emails");
const { authUser } = require("../middleware/jwt");

const router = express.Router();

router.get("/unsubscribe", unsubscribeEmail);
router.post("/aws/send-email", authUser, sendEmailAWS);
router.get("/all-campaigns", authUser, getEmailCampaigns);
router.get("/all-emails", authUser, getEmails);

module.exports = router;
