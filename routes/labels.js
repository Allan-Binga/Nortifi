const express = require("express")
const { newLabel, getLabels, updateLabel, deleteLabel } = require("../controllers/labels")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.post("/new-label", authUser, newLabel)
router.get("/all", authUser, getLabels)
router.patch("/update/:labelId", authUser, updateLabel)
router.delete("/delete/:labelId", authUser, deleteLabel)

module.exports = router