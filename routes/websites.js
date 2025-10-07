const express = require("express")
const { addWebsite, updateWebsite, deleteWebsite, getWebsites, websiteDetails } = require("../controllers/websites")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.post("/add-site", authUser, addWebsite)
router.get("/my-sites", authUser, getWebsites)
router.get("/website/details/:websiteId", authUser, websiteDetails)
router.put("/update-site/:websiteId", authUser, updateWebsite)
router.delete("/delete-site/:websiteId", authUser, deleteWebsite)

module.exports = router