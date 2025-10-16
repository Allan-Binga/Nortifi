const express = require("express");
const {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  addViaCSV,
  getWebsiteCOntacts,
  deleteMultiple,
  exportContacts,
  filterByLabel,
} = require("../controllers/contacts");
const { authUser } = require("../middleware/jwt");
const { uploadCSV } = require("../middleware/upload");

const router = express.Router();

router.post("/create-contact", authUser, createContact);
router.post("/add-via-csv/:websiteId", authUser, uploadCSV.single("file"), addViaCSV);
router.get("/all-contacts/website/:websiteId", authUser, getContacts);
router.get("/all-contacts/label/:labelId", authUser, filterByLabel);
router.post("/export-contacts/:websiteId", authUser, exportContacts)
router.get("/website/:websiteId", authUser, getWebsiteCOntacts)
router.patch("/update-contact/:id", authUser, updateContact);
router.delete("/delete-contact/:id", authUser, deleteContact);
router.delete("/delete/multiple", authUser, deleteMultiple)

module.exports = router;
