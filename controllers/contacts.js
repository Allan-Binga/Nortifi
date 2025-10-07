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

    // Validate required fields dynamically
    const missingFields = [];
    if (!firstName) missingFields.push("First Name");
    if (!email) missingFields.push("Email");
    if (!websiteId) missingFields.push("Website ID");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `The following required field(s) are missing: ${missingFields.join(", ")}.`,
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

//IMport via CSV
const addViaCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const userId = req.userId;
    const bucket = process.env.AWS_S3_BUCKET;
    const key = req.file.key; // multer-s3
    const contacts = [];

    // Parse mapping
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

          const headers = Object.keys(row);
          const contact = {
            user_id: userId,
            prefix: null,
            phone_number: null,
            email: null,
            first_name: null,
            last_name: null,
            address: null,
            city: null,
            postal_code: null,
            country: null,
            state: null,
            gender: null,
            website: null,
            tag: "New Client",
            unsubscribe_token: unsubscribeToken,
          };

          // Apply mapping
          for (const [fieldName, colIndex] of Object.entries(mapping)) {
            if (fieldName === "skip") continue;
            const header = headers[colIndex];
            const value = row[header];

            if (fieldName === "name" && value) {
              const parts = value.split(" ");
              contact.first_name = parts[0] || null;
              contact.last_name = parts.slice(1).join(" ") || null;
            } else {
              contact[fieldName] = value || null;
            }
          }

          // Derive gender from prefix
          if (contact.prefix) {
            const normalized = contact.prefix.trim().toLowerCase();
            if (normalized === "mr") contact.gender = "Male";
            else if (normalized === "mrs") contact.gender = "Female";
          }

          // Validate required fields
          const missingFields = [];
          if (!contact.first_name) missingFields.push("First Name");
          if (!contact.email) missingFields.push("Email");
          if (!contact.website) missingFields.push("Website");

          if (missingFields.length === 0) {
            contacts.push(contact);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (contacts.length === 0) {
      return res.status(400).json({ error: "No valid contacts found in CSV" });
    }

    // Insert contacts
    const insertedContacts = [];
    for (const c of contacts) {
      const insertQuery = `
  INSERT INTO contacts (
    user_id, prefix, phone_number, email, first_name, last_name,
    address, city, postal_code, country, state, gender, website, tag, unsubscribe_token
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (email, user_id) DO NOTHING
  RETURNING *;
`;

      const values = [
        c.user_id,
        c.prefix,
        c.phone_number,
        c.email,
        c.first_name,
        c.last_name,
        c.address,
        c.city,
        c.postal_code,
        c.country,
        c.state,
        c.gender,
        c.website,
        c.tag,
        c.unsubscribe_token,
      ];

      const result = await client.query(insertQuery, values);
      if (result.rows[0]) {
        insertedContacts.push(result.rows[0]);
      }
    }

    // Update websites' JSONB contacts column
    for (const contact of insertedContacts) {
      const contactData = {
        contact_id: contact.contact_id,
        prefix: contact.prefix,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone_number: contact.phone_number,
        address: contact.address,
        city: contact.city,
        postal_code: contact.postal_code,
        country: contact.country,
        state: contact.state,
        gender: contact.gender,
        tag: contact.tag,
        unsubscribe_token: contact.unsubscribe_token,
        unsubscribed: contact.unsubscribed,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
      };

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
      await client.query(updateJsonQuery, [JSON.stringify(contactData), contact.website_id]);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedContacts.length} contacts`,
      count: insertedContacts.length,
    });
  } catch (error) {
    console.error("Error importing contacts via CSV:", error);
    if (error.code === "23505") {
      let field = "field";
      if (error.detail?.includes("email")) field = "Email";
      if (error.detail?.includes("phone_number")) field = "Phone number";
      return res.status(400).json({
        error: `${field} is already taken for some contacts.`,
      });
    }
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
