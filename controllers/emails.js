const client = require("../config/db");
const crypto = require("crypto");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const { uploadFiles } = require("../middleware/upload")

// Generate unsubscribe token
const generateUnsubscribeToken = () => crypto.randomBytes(32).toString("hex");

// Decrypt AES password
const decryptPassword = (encrypted) => {
  const [ivHex, encryptedText] = encrypted.split(":");
  const key = Buffer.from(process.env.SMTP_SECRET_KEY, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Send Email with Nodemailer
const sendEmail = async (req, res) => {
  const userId = req.userId;
  const files = req.files || []; // Files uploaded by multer middleware

  try {
    const {
      campaignId,
      subject,
      body,
      fromName,
      replyToEmail,
      toEmails = '[]', // Default to JSON string "[]"
      cc = '[]',
      bcc = '[]',
      send_type = "immediate",
      scheduled_at = null,
      timezone: campaignTimezone = null,
      recurring_rule = null,
      forceSend = false,
      footerLocations = '[]',
      smtpConfigId,
      saveAsDraft = false,
      socialMedia = '{}',
      companyInfo = '{}',
      filter = '{}',
    } = req.body;

    // Parse JSON strings into arrays and validate
    let toEmailsArray, ccArray, bccArray, tagsArray;
    try {
      toEmailsArray = typeof toEmails === 'string' ? JSON.parse(toEmails) : toEmails;
      ccArray = typeof cc === 'string' ? JSON.parse(cc) : cc;
      bccArray = typeof bcc === 'string' ? JSON.parse(bcc) : bcc;
      tagsArray = filter.tags ? (typeof filter.tags === 'string' ? JSON.parse(filter.tags) : filter.tags) : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid format for toEmails, cc, bcc, or tags",
      });
    }

    // Ensure arrays contain only valid strings and remove empty entries
    toEmailsArray = Array.isArray(toEmailsArray) ? toEmailsArray.filter(email => typeof email === 'string' && email.trim()) : [];
    ccArray = Array.isArray(ccArray) ? ccArray.filter(email => typeof email === 'string' && email.trim()) : [];
    bccArray = Array.isArray(bccArray) ? bccArray.filter(email => typeof email === 'string' && email.trim()) : [];
    tagsArray = Array.isArray(tagsArray) ? tagsArray.filter(tag => typeof tag === 'string' && tag.trim()) : [];

    if (!subject || !body) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and body are required" });
    }

    // Parse footerLocations, socialMedia, and companyInfo
    const parsedFooterLocations = typeof footerLocations === 'string' ? JSON.parse(footerLocations) : footerLocations;
    const parsedSocialMedia = typeof socialMedia === 'string' ? JSON.parse(socialMedia) : socialMedia;
    const parsedCompanyInfo = typeof companyInfo === 'string' ? JSON.parse(companyInfo) : companyInfo;

    // --- Get SMTP Config ---
    let smtpQuery;
    if (smtpConfigId) {
      smtpQuery = await client.query(
        "SELECT * FROM smtp_configs WHERE config_id = $1 AND user_id = $2",
        [smtpConfigId, userId]
      );
    } else {
      smtpQuery = await client.query(
        "SELECT * FROM smtp_configs WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC LIMIT 1",
        [userId]
      );
    }

    if (!smtpQuery.rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "No SMTP configuration found" });
    }

    const smtpConfig = smtpQuery.rows[0];
    const smtpPassword = decryptPassword(smtpConfig.smtp_password);
    const fromEmail = smtpConfig.smtp_user;

    const status = saveAsDraft ? "draft" : "pending";
    const isDraft = saveAsDraft;
    const utcScheduledAt = scheduled_at
      ? moment.tz(scheduled_at, campaignTimezone || "UTC").toDate()
      : null;

    // --- Prepare Attachments ---
    const attachments = files.map((file) => ({
      filename: file.originalname,
      url: file.location, // S3 URL provided by multer-s3
    }));

    let finalCampaignId = campaignId;

    // --- Draft Handling ---
    if (saveAsDraft && !campaignId) {
      const existingDraft = await client.query(
        `SELECT campaign_id FROM campaigns 
         WHERE user_id = $1 AND subject = $2 AND is_draft = true 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, subject]
      );
      if (existingDraft.rows.length > 0) {
        finalCampaignId = existingDraft.rows[0].campaign_id;
      }
    }

    // --- Update or Insert Campaign ---
    if (finalCampaignId) {
      const updateSQL = `
        UPDATE campaigns
        SET subject=$1, body=$2, from_name=$3, from_email=$4, reply_to_email=$5,
            cc=$6, bcc=$7, status=$8, scheduled_at=$9, send_type=$10, timezone=$11,
            recurring_rule=$12, footer_locations=$13, smtp_config_id=$14, is_draft=$15,
            social_media=$16, company_info=$17, tags=$18, attachments=$19
        WHERE campaign_id=$20 AND user_id=$21 RETURNING campaign_id
      `;
      const updateRes = await client.query(updateSQL, [
        subject,
        body,
        fromName || "Nortifi",
        fromEmail,
        replyToEmail || fromEmail,
        ccArray, // Pass array directly for text[]
        bccArray, // Pass array directly for text[]
        status,
        utcScheduledAt,
        send_type,
        campaignTimezone || null,
        recurring_rule || null,
        JSON.stringify(parsedFooterLocations), // JSONB field
        smtpConfig.config_id,
        isDraft,
        JSON.stringify(parsedSocialMedia), // JSONB field
        JSON.stringify(parsedCompanyInfo), // JSONB field
        tagsArray, // Pass array directly for text[]
        JSON.stringify(attachments), // JSONB field
        finalCampaignId,
        userId,
      ]);

      if (!updateRes.rows.length) {
        return res.status(404).json({ success: false, message: "Campaign not found" });
      }

      finalCampaignId = updateRes.rows[0].campaign_id;
      if (saveAsDraft) {
        return res.status(200).json({
          success: true,
          message: "Draft updated successfully",
          campaignId: finalCampaignId,
        });
      }
    } else {
      const insertSQL = `
        INSERT INTO campaigns
          (subject, body, from_name, from_email, reply_to_email, cc, bcc,
           user_id, status, scheduled_at, send_type, timezone, recurring_rule,
           footer_locations, smtp_config_id, is_draft, social_media, company_info, tags, attachments)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING campaign_id
      `;
      const insertRes = await client.query(insertSQL, [
        subject,
        body,
        fromName || "Nortifi",
        fromEmail,
        replyToEmail || fromEmail,
        ccArray, // Pass array directly for text[]
        bccArray, // Pass array directly for text[]
        userId,
        status,
        utcScheduledAt,
        send_type,
        campaignTimezone || null,
        recurring_rule || null,
        JSON.stringify(parsedFooterLocations), // JSONB field
        smtpConfig.config_id,
        isDraft,
        JSON.stringify(parsedSocialMedia), // JSONB field
        JSON.stringify(parsedCompanyInfo), // JSONB field
        tagsArray, // Pass array directly for text[]
        JSON.stringify(attachments), // JSONB field
      ]);
      finalCampaignId = insertRes.rows[0].campaign_id;

      if (saveAsDraft) {
        return res.status(200).json({
          success: true,
          message: "Draft created successfully",
          campaignId: finalCampaignId,
        });
      }
    }

    // --- Resolve Recipients ---
    const recipientsToSend = [];
    for (const email of toEmailsArray) {
      let { rows } = await client.query(
        "SELECT contact_id, unsubscribed, unsubscribe_token FROM contacts WHERE email=$1",
        [email]
      );
      let contact_id, unsubscribed = false, unsubscribe_token;

      if (rows.length > 0) {
        contact_id = rows[0].contact_id;
        unsubscribed = rows[0].unsubscribed;
        unsubscribe_token = rows[0].unsubscribe_token;
      } else {
        unsubscribe_token = generateUnsubscribeToken();
        const { rows: newContact } = await client.query(
          `INSERT INTO contacts (email, unsubscribe_token) VALUES ($1,$2) RETURNING contact_id`,
          [email, unsubscribe_token]
        );
        contact_id = newContact[0].contact_id;
      }

      if (!unsubscribed) {
        recipientsToSend.push({ contact_id, email, unsubscribe_token });
      } else {
        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, contact_id, status, filter_reason)
           VALUES ($1,$2,'skipped','unsubscribed')`,
          [finalCampaignId, contact_id]
        );
      }
    }

    const shouldSendNow = send_type === "immediate" || forceSend;
    if (!shouldSendNow) {
      await client.query(
        `UPDATE campaigns SET status='scheduled', is_draft=false WHERE campaign_id=$1`,
        [finalCampaignId]
      );
      for (const r of recipientsToSend) {
        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, contact_id, status)
           VALUES ($1,$2,'pending')`,
          [finalCampaignId, r.contact_id]
        );
      }
      return res.status(200).json({
        success: true,
        message: "Campaign scheduled",
        campaignId: finalCampaignId,
        recipients_count: recipientsToSend.length,
      });
    }

    // --- Nodemailer Transporter ---
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      secure: smtpConfig.use_tls,
      auth: { user: smtpConfig.smtp_user, pass: smtpPassword },
    });

    // --- Social Media Icons ---
    const socialIcons = {
      facebook: `<a href="${parsedSocialMedia.facebook || '#'}" style="margin:0 8px;display:inline-block;">
        <img src="https://nortifi.s3.eu-north-1.amazonaws.com/facebook.webp" alt="Facebook" width="28" height="28" style="border:0;">
      </a>`,
      twitter: `<a href="${parsedSocialMedia.twitter || '#'}" style="margin:0 8px;display:inline-block;">
        <img src="https://nortifi.s3.eu-north-1.amazonaws.com/twitter.png" alt="Twitter" width="28" height="28" style="border:0;">
      </a>`,
      linkedin: `<a href="${parsedSocialMedia.linkedin || '#'}" style="margin:0 8px;display:inline-block;">
        <img src="https://nortifi.s3.eu-north-1.amazonaws.com/linkedin.png" alt="LinkedIn" width="28" height="28" style="border:0;">
      </a>`,
      instagram: `<a href="${parsedSocialMedia.instagram || '#'}" style="margin:0 8px;display:inline-block;">
        <img src="https://nortifi.s3.eu-north-1.amazonaws.com/instagram2.webp" alt="Instagram" width="28" height="28" style="border:0;">
      </a>`,
    };

    // --- Footer Section ---
    const footerParts = [
      `<div style="background:#f7f7f7;padding:20px;border-radius:4px;margin-top:30px;">
        <div style="text-align:center;margin-bottom:16px;">
          <a href="${process.env.CLIENT_URL}/unsubscribe?token={UNSUBSCRIBE_TOKEN}"
            style="background-color:#007bff;color:#fff;font-size:13px;padding:10px 18px;
            text-decoration:none;border-radius:6px;display:inline-block;font-weight:500;">
            Unsubscribe
          </a>
        </div>
      </div>`,
    ];

    if (parsedCompanyInfo.name)
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;"><strong>${parsedCompanyInfo.name}</strong></p>`
      );
    if (parsedCompanyInfo.location)
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;">${parsedCompanyInfo.location}</p>`
      );
    if (parsedCompanyInfo.customerCare)
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;">Customer Care: ${parsedCompanyInfo.customerCare}</p>`
      );

    if (parsedFooterLocations.length) {
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;"><strong>Our Locations:</strong></p>`
      );
      parsedFooterLocations.forEach((loc) => {
        footerParts.push(
          `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;">${loc.location}: ${loc.address}, ${loc.phone}</p>`
        );
      });
    }

    const socialLinks = [];
    if (parsedSocialMedia.facebook) socialLinks.push(socialIcons.facebook);
    if (parsedSocialMedia.twitter) socialLinks.push(socialIcons.twitter);
    if (parsedSocialMedia.linkedin) socialLinks.push(socialIcons.linkedin);
    if (parsedSocialMedia.instagram) socialLinks.push(socialIcons.instagram);
    if (socialLinks.length)
      footerParts.push(`<div style="text-align:center;margin:10px 0;">${socialLinks.join("")}</div>`);

    if (parsedCompanyInfo.privacyPolicy)
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;"><a href="${parsedCompanyInfo.privacyPolicy}" style="color:#007bff;">Privacy Policy</a></p>`
      );
    if (parsedCompanyInfo.termsConditions)
      footerParts.push(
        `<p style="font-size:12px;color:#666;margin:2px 0;text-align:center;"><a href="${parsedCompanyInfo.termsConditions}" style="color:#007bff;">Terms and Conditions</a></p>`
      );

    // --- Prepare Email Attachments ---
    const attachmentObjects = [];
    for (const attachment of attachments) {
      try {
        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error(`Failed to fetch ${attachment.filename}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        attachmentObjects.push({
          filename: attachment.filename,
          content: buffer,
          contentType: response.headers.get("content-type"),
        });
      } catch (error) {
        console.error(`Error fetching attachment ${attachment.filename}:`, error);
      }
    }

    // --- Send Emails ---
    for (const recipient of recipientsToSend) {
      const htmlTemplate = `<div style="font-family:Arial,sans-serif;">
        ${body}
        <div style="border-top:1px solid #ccc;padding-top:10px;margin-top:20px;
        background:#f7f7f7;border-radius:4px;padding-bottom:20px;">
          ${footerParts.join("")}
        </div>
      </div>`.replace("{UNSUBSCRIBE_TOKEN}", recipient.unsubscribe_token);

      await transporter.sendMail({
        from: { name: fromName || "Nortifi", address: fromEmail },
        to: recipient.email,
        cc: ccArray, // Use parsed array for Nodemailer
        bcc: bccArray, // Use parsed array for Nodemailer
        subject,
        html: htmlTemplate,
        text: body.replace(/<\/?[^>]+(>|$)/g, ""),
        replyTo: replyToEmail || fromEmail,
        attachments: attachmentObjects, // Attach files
      });

      await client.query(
        `INSERT INTO campaign_recipients (campaign_id, contact_id, status, sent_at)
         VALUES ($1,$2,'sent',NOW())`,
        [finalCampaignId, recipient.contact_id]
      );
    }

    await client.query(
      `UPDATE campaigns SET status='sent', is_draft=false WHERE campaign_id=$1`,
      [finalCampaignId]
    );

    return res.status(200).json({
      success: true,
      message: `Campaign sent to ${recipientsToSend.length} recipients.`,
      campaignId: finalCampaignId,
      recipients: recipientsToSend.map((r) => r.email),
    });
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send emails",
      error: error.message,
    });
  }
};

//Unsubscribe
const unsubscribeEmail = async (req, res) => {
  const { token } = req.query;
  console.log(token);

  if (!token) {
    return res.status(400).send("Invalid unsubscribe link");
  }

  try {
    //Find Contact By Token
    const { rows } = await client.query(
      "SELECT contact_id, unsubscribed FROM contacts WHERE unsubscribe_token = $1",
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).send("Contact not found");
    }

    const contact = rows[0];

    if (contact.unsubscribed) {
      return res.send("You are already unsubscribed.");
    }

    //Update Status
    await client.query(
      "UPDATE contacts SET unsubscribed = true WHERE contact_id = $1",
      [contact.contact_id]
    );

    return res.send("You have been unsubscribed successfully.");
  } catch (error) {
    console.error("Unsubscribe error:", err);
    return res.status(500).send("An error occurred while unsubscribing.");
  }
};

//Get Campaigns
const getEmailCampaigns = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM campaigns ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Fetch campaigns by status (or all)
const getCampaignsByStatus = async (req, res) => {
  const userId = req.userId;
  const { status } = req.params;

  try {
    let result;

    if (status === "all") {
      // Fetch all campaigns for the user
      result = await client.query(
        `SELECT * FROM campaigns
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
    } else {
      // Fetch campaigns by specific status
      result = await client.query(
        `SELECT * FROM campaigns
         WHERE user_id = $1 AND status = $2
         ORDER BY created_at DESC`,
        [userId, status]
      );
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Single Campaign with Recipients
const getSingleCampaign = async (req, res) => {
  const userId = req.userId;
  const { campaignId } = req.params;

  try {
    // Fetch the campaign itself
    const campaignQuery = `
      SELECT * 
      FROM campaigns 
      WHERE campaign_id = $1 AND user_id = $2
      LIMIT 1
    `;
    const campaignValues = [campaignId, userId];
    const campaignResult = await client.query(campaignQuery, campaignValues);

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const campaign = campaignResult.rows[0];

    // Fetch recipients with their contact info
    const recipientsQuery = `
      SELECT cr.id AS recipient_id,
             cr.status AS recipient_status,
             cr.sent_at,
             cr.filter_reason,
             c.contact_id,
             c.first_name,
             c.last_name,
             c.email,
             c.phone_number,
             c.unsubscribed
      FROM campaign_recipients cr
      JOIN contacts c ON cr.contact_id = c.contact_id
      WHERE cr.campaign_id = $1
      ORDER BY cr.sent_at DESC
    `;
    const recipientsResult = await client.query(recipientsQuery, [campaignId]);

    // Attach recipients to campaign object
    campaign.recipients = recipientsResult.rows;

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//Get Emails
const getEmails = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM campaign_recipients ORDER BY sent_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Fetch Session Recipients
const getCampaignRecipients = async (req, res) => {
  try {
    const { campaignId, sentAt } = req.query;

    if (!campaignId || !sentAt) {
      return res.status(400).json({
        error: "campaignId and sentAt query params are required",
      });
    }

    const query = `
      SELECT cr.id, cr.campaign_id, cr.contact_id, cr.status, cr.sent_at,
             c.email
      FROM campaign_recipients cr
      JOIN contacts c ON cr.contact_id = c.id
      WHERE cr.campaign_id = $1
        AND cr.sent_at = $2
      ORDER BY cr.id ASC
    `;

    const values = [campaignId, sentAt];

    const { rows } = await client.query(query, values);

    return res.status(200).json({
      campaignId,
      sentAt,
      recipients: rows,
    });
  } catch (error) {
    console.error("Error fetching campaign recipients:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  sendEmail,
  unsubscribeEmail,
  getEmailCampaigns,
  getCampaignsByStatus,
  getSingleCampaign,
  getEmails,
  getCampaignRecipients,
};
