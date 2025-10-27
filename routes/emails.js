const express = require("express");
const {
  getEmailCampaigns,
  getEmails,
  unsubscribeEmail,
  getCampaignRecipients,
  sendEmail,
  getSingleCampaign,
  getCampaignsByStatus,
} = require("../controllers/emails");
const { authUser } = require("../middleware/jwt");
const {uploadFiles} = require("../middleware/upload")

const router = express.Router();

router.get("/unsubscribe", unsubscribeEmail);
router.post("/smtp/send-email", authUser, uploadFiles, sendEmail)
router.get("/all-campaigns", authUser, getEmailCampaigns);
router.get("/all-campaigns/:status", authUser, getCampaignsByStatus)
router.get("/campaign/:campaignId", authUser, getSingleCampaign)
router.get("/all-emails", authUser, getEmails);
router.get("/campaign-recipients", authUser, getCampaignRecipients)

module.exports = router;
