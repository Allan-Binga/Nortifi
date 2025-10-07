const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const csv = require("csv-parser");
const client = require("../config/db");
const crypto = require("crypto");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
    const {
      prefix,
      firstName,
      lastName,
      email,
      websiteId,
      phoneNumber,
      address,
      country,
      state,
      city,
      postalCode,
      tag,
    } = req.body;

    const userId = req.userId;

    // Validate required fields
    if (!firstName || !email || !websiteId) {
      return res.status(400).json({
        error: "First name, email, and website ID are required.",
      });
    }

    // Determine gender
    let gender = null;
    if (prefix) {
      const normalized = prefix.trim().toLowerCase();
      if (normalized === "mr") gender = "Male";
      else if (normalized === "mrs") gender = "Female";
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(20).toString("hex");

    // Ensure website exists for this user
    const websiteCheck = await client.query(
      `SELECT website_id, contacts FROM websites WHERE website_id = $1 AND user_id = $2`,
      [websiteId, userId]
    );

    if (websiteCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Website not found or doesn't belong to the current user.",
      });
    }

    // Insert new contact into contacts table
    const insertQuery = `
      INSERT INTO contacts (
        user_id,
        prefix,
        phone_number,
        email,
        first_name,
        last_name,
        address,
        city,
        postal_code,
        country,
        state,
        gender,
        website_id,
        unsubscribe_token,
        tag
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING *;
    `;

    const values = [
      userId,
      prefix,
      phoneNumber,
      email,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      country,
      state,
      gender,
      websiteId,
      unsubscribeToken,
      tag,
    ];

    const result = await client.query(insertQuery, values);
    const newContact = result.rows[0];

    // Prepare full contact object for JSONB update
    const contactData = {
      contact_id: newContact.contact_id,
      prefix: newContact.prefix,
      first_name: newContact.first_name,
      last_name: newContact.last_name,
      email: newContact.email,
      phone_number: newContact.phone_number,
      address: newContact.address,
      city: newContact.city,
      postal_code: newContact.postal_code,
      country: newContact.country,
      state: newContact.state,
      gender: newContact.gender,
      tag: newContact.tag,
      unsubscribe_token: newContact.unsubscribe_token,
      unsubscribed: newContact.unsubscribed,
      created_at: newContact.created_at,
      updated_at: newContact.updated_at,
    };

    // Update website contacts JSONB column (append new contact)
    const updateJsonQuery = `
      UPDATE websites
      SET contacts = 
        CASE 
          WHEN contacts IS NULL THEN jsonb_build_array($1::jsonb)
          ELSE contacts || $1::jsonb
        END,
        updated_at = NOW()
      WHERE website_id = $2;
    `;

    await client.query(updateJsonQuery, [JSON.stringify(contactData), websiteId]);

    res.status(201).json({
      message: "Contact created successfully and added to website contacts.",
      contact: newContact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);

    if (error.code === "23505") {
      let field = "field";
      if (error.detail?.includes("email")) field = "Email";
      if (error.detail?.includes("phone_number")) field = "Phone number";
      return res.status(400).json({
        error: `${field} is already taken. Please use a different one.`,
      });
    }

    res.status(500).json({ error: "Failed to create contact" });
  }
};

// Add Contacts via CSV
const addViaCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const userId = req.userId;
    const bucket = process.env.AWS_S3_BUCKET;
    const key = req.file.key; // multer-s3
    const contacts = [];

    // Mapping
    let mapping = {};
    try {
      mapping = JSON.parse(req.body.mapping || "{}");
    } catch (err) {
      return res.status(400).json({ error: "Invalid mapping format" });
    }

    // Fetch file from S3
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    // Parse CSV stream with mapping applied
    await new Promise((resolve, reject) => {
      response.Body.pipe(csv())
        .on("data", (row) => {
          const unsubscribeToken = crypto.randomBytes(20).toString("hex");

          // row keys are the CSV headers, e.g. "email", "phone_number", etc.
          const headers = Object.keys(row); // e.g. ["tag","phone_number","name","website","email"]

          const contact = {
            user_id: userId,
            phone_number: null,
            email: null,
            first_name: null,
            last_name: null,
            tag: "New Client",
            website: null,
            unsubscribe_token: unsubscribeToken,
          };

          // Go through each column index mapped by the frontend
          for (const [colIndex, fieldName] of Object.entries(mapping)) {
            const header = headers[colIndex]; // find the CSV header name at that index
            const value = row[header];

            if (fieldName === "name" && value) {
              const parts = value.split(" ");
              contact.first_name = parts[0] || null;
              contact.last_name = parts.slice(1).join(" ") || null;
            } else {
              contact[fieldName] = value || contact[fieldName];
            }
          }

          if (contact.email) {
            contacts.push(contact);
          }
        })

        .on("end", resolve)
        .on("error", reject);
    });

    // Insert contacts one by one (safe for small uploads)
    for (const c of contacts) {
      await client.query(
        `INSERT INTO contacts 
         (user_id, phone_number, email, first_name, last_name, tag, website, unsubscribe_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (email, user_id) DO NOTHING`,
        [
          c.user_id,
          c.phone_number,
          c.email,
          c.first_name,
          c.last_name,
          c.tag,
          c.website,
          c.unsubscribe_token,
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: "Contacts imported successfully",
      count: contacts.length,
    });
  } catch (error) {
    console.error("Error importing contacts via CSV:", error);
    return res.status(500).json({ error: "Failed to import contacts" });
  }
};

//Fetch Website contacts
const getWebsiteCOntacts = async (req, res) => {
  const { websiteId } = req.params;
  try {
    const query = `SELECT contacts FROM websites WHERE website_id = $1`;
    const result = await client.query(query, [websiteId]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Website not found" });

    res.json({ contacts: result.rows[0].contacts || [] });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
}


// Update a contact
const updateContact = async (req, res) => {
  try {
    const { id } = req.params; // contact_id from route param
    const {
      phoneNumber,
      email,
      firstName,
      lastName,
      website,
      address,
      country,
      state,
      gender,
    } = req.body;

    const result = await client.query(
      `UPDATE contacts
       SET phone_number = COALESCE($1, phone_number),
           email = COALESCE($2, email),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           website = COALESCE($5, website),
           address = COALESCE($6, address),
           country = COALESCE($7, country),
           state = COALESCE($8, state),
           gender = COALESCE($9, gender),
           updated_at = NOW()
       WHERE contact_id = $10
       RETURNING *`,
      [
        phoneNumber,
        email,
        firstName,
        lastName,
        website,
        address,
        country,
        state,
        gender,
        id,
      ]
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

// Bulk Delete Contacts
const deleteMultiple = async (req, res) => {
  try {
    const userId = req.userId;
    const { ids } = req.body; // Expecting an array of contact IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide an array of contact IDs to delete." });
    }

    // Generate parameter placeholders for the contact IDs
    const placeholders = ids.map((_, index) => `$${index + 2}`).join(", ");
    const deleteQuery = `
      DELETE FROM contacts
      WHERE user_id = $1 AND contact_id IN (${placeholders})
      RETURNING *;
    `;

    // The first parameter is userId, followed by the contact IDs
    const result = await client.query(deleteQuery, [userId, ...ids]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No matching contacts found for the provided IDs and user.",
      });
    }

    res.status(200).json({
      message: `${result.rows.length} contact(s) deleted successfully.`,
      deletedContacts: result.rows,
    });
  } catch (error) {
    console.error("Error deleting multiple contacts:", error);
    res.status(500).json({ error: "Failed to delete multiple contacts." });
  }
};



module.exports = {
  getContacts,
  createContact,
  addViaCSV,
  getWebsiteCOntacts,
  updateContact,
  deleteContact,
  deleteMultiple,
};
