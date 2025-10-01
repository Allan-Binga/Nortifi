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
    const { firstName, lastName, email, website, phoneNumber, address, country, state, gender } = req.body;
    const userId = req.userId;

    // Generate unique unsubscribe token
    const unsubscribeToken = crypto.randomBytes(20).toString("hex");

    const result = await client.query(
      `INSERT INTO contacts (
      user_id,
      phone_number,
      email,
      first_name,
      last_name,
      address,
      country,
      state,
      gender,
      website,
      unsubscribe_token
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
    RETURNING *`,
      [
        userId,
        phoneNumber,
        email,
        firstName,
        lastName,
        address,
        country,
        state,
        gender,
        website,
        unsubscribeToken,
      ]
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

//Add Contacts via CSV
const addViaCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const userId = req.userId;
    const bucket = process.env.AWS_S3_BUCKET;
    const key = req.file.key; // multer-s3
    const contacts = [];

    // Fetch file from S3
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    // Parse CSV stream
    await new Promise((resolve, reject) => {
      response.Body.pipe(csv())
        .on("data", (row) => {
          const unsubscribeToken = crypto.randomBytes(20).toString("hex");

          contacts.push({
            user_id: userId,
            phone_number: row.phone_number || null,
            email: row.email,
            name: row.name || null,
            tag: row.tag || "New Client",
            website: row.website || null,
            unsubscribe_token: unsubscribeToken,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Insert contacts one by one (safe for small uploads)
    for (const c of contacts) {
      await client.query(
        `INSERT INTO contacts 
         (user_id, phone_number, email, name, tag, website, unsubscribe_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (email, user_id) DO NOTHING`,
        [
          c.user_id,
          c.phone_number,
          c.email,
          c.name,
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

module.exports = {
  getContacts,
  createContact,
  addViaCSV,
  updateContact,
  deleteContact,
};
