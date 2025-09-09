const express = require("express")
const {createContact, getContacts, updateContact, deleteContact} = require("../controllers/contacts")
const { authUser } = require("../middleware/jwt")

const router = express.Router()

router.post("/create-contact", authUser, createContact)
router.get("/all-contacts", authUser, getContacts)
router.patch("/update-contact/:id", authUser, updateContact)
router.delete("/delete-contact/:id", authUser, deleteContact)

module.exports = router