const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const csv = require("csv-parser");
const client = require("../config/db");
const crypto = require("crypto");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Fetch all contacts
const getContacts = async (req, res) => {
  const userId = req.userId;
  const { websiteId } = req.params
  try {
    let result;
    if (websiteId) {
      result = await client.query(
        "SELECT * FROM contacts WHERE user_id = $1 AND website_id = $2 ORDER BY created_at DESC",
        [userId, websiteId]
      );
    } else {
      result = await client.query(
        "SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC", [userId]
      )
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

//Filter Contacts by Labels
const filterByLabel = async (req, res) => {
  const userId = req.userId;
  const { labelId } = req.params;

  try {
    const query = `
      SELECT * FROM contacts
      WHERE user_id = $1 AND label_id = $2
      ORDER BY created_at DESC;
    `;
    const result = await client.query(query, [userId, labelId]);
    res.status(200).json({ success: true, contacts: result.rows });
  } catch (error) {
    console.error("Error filtering contacts by label:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Create a contact
const createContact = async (req, res) => {
  try {
    const {
      email,
      phoneNumber,
      firstName,
      lastName,
      address,
      country,
      state,
      prefix,
      city,
      postalCode,
      websiteId,
      labelId,
    } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: "Email is a required field." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!/^\+\d{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    // Validate field lengths based on schema
    if (firstName.length > 100) {
      return res.status(400).json({ error: "First name must be 100 characters or less." });
    }
    if (lastName && lastName.length > 100) {
      return res.status(400).json({ error: "Last name must be 100 characters or less." });
    }
    if (address && address.length > 255) {
      return res.status(400).json({ error: "Address must be 255 characters or less." });
    }
    if (country && country.length > 100) {
      return res.status(400).json({ error: "Country must be 100 characters or less." });
    }
    if (state && state.length > 100) {
      return res.status(400).json({ error: "State must be 100 characters or less." });
    }
    if (prefix && prefix.length > 10) {
      return res.status(400).json({ error: "Prefix must be 10 characters or less." });
    }
    if (city && city.length > 100) {
      return res.status(400).json({ error: "City must be 100 characters or less." });
    }
    if (postalCode && postalCode.length > 20) {
      return res.status(400).json({ error: "Postal code must be 20 characters or less." });
    }

    // Derive gender from prefix
    let gender = null;
    if (prefix) {
      if (prefix === "Mr") gender = "Male";
      else if (prefix === "Mrs" || prefix === "Ms") gender = "Female";
      // "Dr" or other prefixes leave gender as null
    }

    // Validate labelId if provided
    if (labelId) {
      const labelCheck = await client.query(
        `SELECT label_id FROM labels WHERE label_id = $1 AND user_id = $2`,
        [labelId, userId]
      );
      if (labelCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid label or not owned by user." });
      }
    }

    // Validate websiteId if provided
    if (websiteId) {
      const websiteCheck = await client.query(
        `SELECT website_id FROM websites WHERE website_id = $1 AND user_id = $2`,
        [websiteId, userId]
      );
      if (websiteCheck.rows.length === 0) {
        return res.status(404).json({
          error: "Website not found or doesn't belong to the current user.",
        });
      }
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(20).toString("hex");

    // Insert contact
    const insertQuery = `
      INSERT INTO contacts (
        user_id,
        email,
        phone_number,
        first_name,
        last_name,
        address,
        country,
        state,
        prefix,
        city,
        postal_code,
        gender,
        website_id,
        label_id,
        unsubscribe_token
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      userId,
      email,
      phoneNumber,
      firstName,
      lastName || null,
      address || null,
      country || null,
      state || null,
      prefix || null,
      city || null,
      postalCode || null,
      gender,
      websiteId || null,
      labelId || null,
      unsubscribeToken,
    ];

    const result = await client.query(insertQuery, values);
    const newContact = result.rows[0];

    // Update website JSONB if websiteId is provided
    if (websiteId) {
      const contactData = {
        contact_id: newContact.contact_id,
        email: newContact.email,
        phone_number: newContact.phone_number,
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        address: newContact.address,
        country: newContact.country,
        state: newContact.state,
        prefix: newContact.prefix,
        city: newContact.city,
        postal_code: newContact.postal_code,
        gender: newContact.gender,
        label_id: newContact.label_id,
        unsubscribed: newContact.unsubscribed,
        unsubscribe_token: newContact.unsubscribe_token,
        created_at: newContact.created_at,
        updated_at: newContact.updated_at,
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

      await client.query(updateJsonQuery, [JSON.stringify(contactData), websiteId]);
    }

    res.status(201).json({
      message: "Contact created successfully.",
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

// Import via CSV
const addViaCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    const userId = req.userId;
    const { websiteId } = req.params;
    const { labelId } = req.body;
    const bucket = process.env.AWS_S3_BUCKET;
    const key = req.file.key;
    const contacts = [];

    // Parse mapping
    let mapping = {};
    try {
      mapping = JSON.parse(req.body.mapping || "{}");
    } catch (err) {
      return res.status(400).json({ error: "Invalid mapping format" });
    }

    // Fetch CSV file from S3
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    // Parse CSV and build contact objects
    await new Promise((resolve, reject) => {
      response.Body.pipe(csv())
        .on("data", (row) => {
          const unsubscribeToken = crypto.randomBytes(20).toString("hex");
          const headers = Object.keys(row);

          const contact = {
            user_id: userId,
            website_id: websiteId,
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
            label_id: labelId || null, // Use provided labelId or null
            unsubscribe_token: unsubscribeToken,
          };

          // Apply mapping
          for (const [colIndex, fieldName] of Object.entries(mapping)) {
            const index = parseInt(colIndex);
            if (isNaN(index) || !headers[index]) continue;
            const value = row[headers[index]];
            if (fieldName && value !== undefined && value !== null && value.trim() !== "") {
              contact[fieldName] = value.trim();
            }
          }

          // Gender inference
          if (contact.prefix) {
            const normalized = contact.prefix.trim().toLowerCase();
            if (normalized === "mr") contact.gender = "Male";
            else if (normalized === "mrs") contact.gender = "Female";
          }

          // Only add contact if at least one mapped field is non-null (excluding user_id, website_id, label_id, unsubscribe_token)
          const hasData = Object.keys(contact).some(
            (key) =>
              !["user_id", "website_id", "label_id", "unsubscribe_token"].includes(key) &&
              contact[key] !== null
          );
          if (hasData) {
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
          user_id, website_id, prefix, phone_number, email, first_name, last_name,
          address, city, postal_code, country, state, gender, label_id, unsubscribe_token
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (email, user_id) DO NOTHING
        RETURNING *;
      `;

      const values = [
        c.user_id,
        c.website_id,
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
        c.label_id,
        c.unsubscribe_token,
      ];

      const result = await client.query(insertQuery, values);
      if (result.rows[0]) insertedContacts.push(result.rows[0]);
    }

    // Update website's contacts JSONB
    for (const contact of insertedContacts) {
      const contactData = {
        contact_id: contact.contact_id,
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
        label_id: contact.label_id,
        unsubscribe_token: contact.unsubscribe_token,
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
      message: `Successfully imported ${insertedContacts.length} contacts.`,
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

//Export contacts to PDF, CSV, TXT or Excel.
const exportContacts = async (req, res) => {
  const userId = req.userId;
  const { websiteId } = req.params;
  const format = (req.query.format || "csv").toLowerCase();
  const { contactIds } = req.body || {};

  if (!websiteId) {
    return res.status(400).json({ error: "websiteId is required as a route param." });
  }

  if (!["csv", "pdf", "txt", "xlsx"].includes(format)) {
    return res.status(400).json({ error: "Invalid format. Use 'csv', 'pdf', 'txt', or 'xlsx'." });
  }

  try {
    let query;
    let params = [userId, websiteId];

    if (Array.isArray(contactIds) && contactIds.length > 0) {
      const placeholders = contactIds.map((_, i) => `$${i + 3}`).join(", ");
      query = `
        SELECT c.contact_id, c.first_name, c.last_name, c.email, c.phone_number, c.prefix,
               c.address, c.city, c.state, c.country, c.postal_code,
               COALESCE(l.name, 'No Label') AS label,
               c.gender, c.unsubscribed, c.created_at
        FROM contacts c
        LEFT JOIN labels l ON c.label_id = l.label_id
        WHERE c.user_id = $1 AND c.website_id = $2 AND c.contact_id IN (${placeholders})
        ORDER BY c.created_at DESC
      `;
      params = [...params, ...contactIds];
    } else {
      query = `
        SELECT c.contact_id, c.first_name, c.last_name, c.email, c.phone_number, c.prefix,
               c.address, c.city, c.state, c.country, c.postal_code,
               COALESCE(l.name, 'No Label') AS label,
               c.gender, c.unsubscribed, c.created_at
        FROM contacts c
        LEFT JOIN labels l ON c.label_id = l.label_id
        WHERE c.user_id = $1 AND c.website_id = $2
        ORDER BY c.created_at DESC
      `;
    }

    const { rows: contacts } = await client.query(query, params);

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ error: "No contacts found for export." });
    }

    // ---------- CSV ----------
    if (format === "csv") {
      const fields = Object.keys(contacts[0]);
      const parser = new Parser({ fields });
      const csvData = parser.parse(contacts);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="contacts-${websiteId}.csv"`);
      return res.status(200).send(csvData);
    }

    // ---------- TXT ----------
    if (format === "txt") {
      const lines = contacts.map(c =>
        `${c.first_name || ""} ${c.last_name || ""} | ${c.email || ""} | ${c.phone_number || ""} | ${c.label || ""}`
      );
      const txtData = lines.join("\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="contacts-${websiteId}.txt"`);
      return res.status(200).send(txtData);
    }

    // ---------- XLSX ----------
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Contacts");

      worksheet.columns = Object.keys(contacts[0]).map((key) => ({
        header: key.toUpperCase(),
        key,
        width: 20,
      }));

      worksheet.addRows(contacts);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contacts-${websiteId}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    // ---------- PDF ----------
    if (format === "pdf") {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="contacts-${websiteId}.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text("Contacts Export", { align: "center" });
      doc.moveDown(1);

      const headers = ["First", "Last", "Email", "Phone", "City", "Country", "Label", "Unsub", "Created"];
      const widths = [70, 70, 180, 90, 70, 70, 70, 50, 100];
      const startX = doc.page.margins.left;
      let y = doc.y;

      doc.font("Helvetica-Bold").fontSize(9);
      let x = startX;
      headers.forEach((h, i) => {
        doc.text(h, x, y, { width: widths[i] });
        x += widths[i];
      });

      y += 14;
      doc.font("Helvetica").fontSize(8);
      const pageBottom = doc.page.height - doc.page.margins.bottom - 10;

      for (const c of contacts) {
        if (y > pageBottom) {
          doc.addPage({ layout: "landscape" });
          y = doc.page.margins.top;
        }

        x = startX;
        const values = [
          c.first_name || "",
          c.last_name || "",
          c.email || "",
          c.phone_number || "",
          c.city || "",
          c.country || "",
          c.label || "",
          c.unsubscribed ? "Yes" : "No",
          c.created_at ? new Date(c.created_at).toLocaleString() : "",
        ];

        values.forEach((v, i) => {
          doc.text(String(v), x, y, {
            width: widths[i],
            ellipsis: true,
          });
          x += widths[i];
        });

        y += 12;
      }

      doc.end();
      return;
    }
  } catch (err) {
    console.error("Error exporting contacts:", err);
    return res.status(500).json({ error: "Failed to export contacts." });
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
  const userId = req.userId;

  try {
    const { id } = req.params;
    const {
      email,
      phoneNumber,
      firstName,
      lastName,
      address,
      country,
      state,
      prefix,
      city,
      postalCode,
      labelId,
      websiteId,
    } = req.body;

    // Make sure something was sent
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No fields provided for update." });
    }

    // Fetch existing contact
    const existing = await client.query(
      `SELECT * FROM contacts WHERE contact_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Contact not found or you do not have permission to update it." });
    }
    const existingContact = existing.rows[0];

    // Validate only provided fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
      if (!/^\+\d{7,15}$/.test(cleanPhone)) {
        return res.status(400).json({ error: "Invalid phone number format." });
      }
    }

    if (firstName && firstName.length > 100)
      return res.status(400).json({ error: "First name must be 100 characters or less." });
    if (lastName && lastName.length > 100)
      return res.status(400).json({ error: "Last name must be 100 characters or less." });
    if (address && address.length > 255)
      return res.status(400).json({ error: "Address must be 255 characters or less." });
    if (country && country.length > 100)
      return res.status(400).json({ error: "Country must be 100 characters or less." });
    if (state && state.length > 100)
      return res.status(400).json({ error: "State must be 100 characters or less." });
    if (prefix && prefix.length > 10)
      return res.status(400).json({ error: "Prefix must be 10 characters or less." });
    if (city && city.length > 100)
      return res.status(400).json({ error: "City must be 100 characters or less." });
    if (postalCode && postalCode.length > 20)
      return res.status(400).json({ error: "Postal code must be 20 characters or less." });

    // Validate labelId and websiteId if provided
    if (labelId) {
      const labelCheck = await client.query(
        `SELECT label_id FROM labels WHERE label_id = $1 AND user_id = $2`,
        [labelId, userId]
      );
      if (labelCheck.rows.length === 0)
        return res.status(400).json({ error: "Invalid label or not owned by user." });
    }

    if (websiteId) {
      const websiteCheck = await client.query(
        `SELECT website_id FROM websites WHERE website_id = $1 AND user_id = $2`,
        [websiteId, userId]
      );
      if (websiteCheck.rows.length === 0)
        return res.status(404).json({ error: "Website not found or doesn't belong to the user." });
    }

    // Derive gender if prefix provided
    let gender = existingContact.gender;
    if (prefix) {
      if (prefix === "Mr") gender = "Male";
      else if (prefix === "Mrs" || prefix === "Ms") gender = "Female";
      else gender = null;
    }

    // Dynamically build update query
    const fields = {
      email,
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      address,
      country,
      state,
      prefix,
      city,
      postal_code: postalCode,
      label_id: labelId,
      website_id: websiteId,
      gender,
    };

    const updates = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${i}`);
        values.push(value);
        i++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    values.push(id, userId);

    await client.query("BEGIN");

    const updateQuery = `
      UPDATE contacts
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE contact_id = $${i++} AND user_id = $${i}
      RETURNING *;
    `;

    const result = await client.query(updateQuery, values);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Contact not found or not owned by user." });
    }

    const updatedContact = result.rows[0];

    // Update website JSONB if relevant
    const targetWebsiteId = websiteId || existingContact.website_id;
    if (targetWebsiteId) {
      const contactData = {
        contact_id: updatedContact.contact_id,
        email: updatedContact.email,
        phone_number: updatedContact.phone_number,
        first_name: updatedContact.first_name,
        last_name: updatedContact.last_name,
        address: updatedContact.address,
        country: updatedContact.country,
        state: updatedContact.state,
        prefix: updatedContact.prefix,
        city: updatedContact.city,
        postal_code: updatedContact.postal_code,
        gender: updatedContact.gender,
        label_id: updatedContact.label_id,
        unsubscribed: updatedContact.unsubscribed,
        unsubscribe_token: updatedContact.unsubscribe_token,
        created_at: updatedContact.created_at,
        updated_at: updatedContact.updated_at,
      };

      await client.query(
        `
        UPDATE websites
        SET contacts = (
          SELECT jsonb_agg(
            CASE
              WHEN c->>'contact_id' = $1 THEN $2::jsonb
              ELSE c
            END
          )
          FROM jsonb_array_elements(contacts) c
        ),
        updated_at = NOW()
        WHERE website_id = $3 AND user_id = $4;
      `,
        [
          updatedContact.contact_id.toString(),
          JSON.stringify(contactData),
          targetWebsiteId,
          userId,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Contact updated successfully.",
      contact: updatedContact,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating contact:", error);

    if (error.code === "23505") {
      let field = "field";
      if (error.detail?.includes("email")) field = "Email";
      if (error.detail?.includes("phone_number")) field = "Phone number";
      return res.status(400).json({
        error: `${field} is already taken. Please use a different one.`,
      });
    }

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
  filterByLabel,
  createContact,
  addViaCSV,
  exportContacts,
  getWebsiteCOntacts,
  updateContact,
  deleteContact,
  deleteMultiple,
};
