const client = require("../config/db");

// Fetch all contacts
const getContacts = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Create a contact
const createContact = async (req, res) => {
  try {
    const { name, email, phoneNumber, tag, website } = req.body;

    const result = await client.query(
      `INSERT INTO contacts (phone_number, email, name, tag, website)
       VALUES ($1, $2, $3, COALESCE($4, 'New Client'), $5)
       RETURNING *`,
      [phoneNumber, email, name, tag, website]
    );

    res.status(201).json({
      message: "Contact created successfully.",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
};
// Update a contact
const updateContact = async (req, res) => {
  try {
    const { id } = req.params; // contact_id from route param
    const { phoneNumber, email, name, tag } = req.body;

    const result = await client.query(
      `UPDATE contacts
       SET phone_number = COALESCE($1, phone_number),
           email = COALESCE($2, email),
           name = COALESCE($3, name),
           tag = COALESCE($4, tag),
           updated_at = NOW()
       WHERE contact_id = $5
       RETURNING *`,
      [phoneNumber, email, name, tag, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.status(200).json({
      message: "Contact updated successfully.",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

// Delete a contact
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      "DELETE FROM contacts WHERE contact_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res
      .status(200)
      .json({ message: "Contact deleted", contact: result.rows[0] });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
};

module.exports = { getContacts, createContact, updateContact, deleteContact };
