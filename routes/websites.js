const express = require("express")
const { addWebsite, updateWebsite, deleteWebsite } = require("../controllers/websites")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.post("/add-site", authUser, addWebsite)
router.put("/update-site/:websiteId", authUser, updateWebsite)
router.delete("/delete-site/:websiteId", authUser, deleteWebsite)

module.exports = router