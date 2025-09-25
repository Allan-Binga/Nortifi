const express = require("express");
const {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  addViaCSV,
} = require("../controllers/contacts");
const { authUser } = require("../middleware/jwt");
const { uploadCSV } = require("../middleware/upload");

const router = express.Router();

router.post("/create-contact", authUser, createContact);
router.post("/add-via-csv", authUser, uploadCSV.single("file"), addViaCSV);
router.get("/all-contacts", authUser, getContacts);
router.patch("/update-contact/:id", authUser, updateContact);
router.delete("/delete-contact/:id", authUser, deleteContact);

module.exports = router;
