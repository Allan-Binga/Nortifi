const client = require("../config/db");
const ses = require("../config/sesClient");
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const crypto = require("crypto");
const moment = require("moment-timezone");

const generateUnsubscribeToken = () => crypto.randomBytes(32).toString("hex");

// AWS SES
const sendEmailAWS = async (req, res) => {
  const userId = req.userId;
  try {
    const {
      label,
      subject,
      body,
      fromName,
      fromEmail,
      replyToEmail,
      toEmails = [],
      cc = [],
      bcc = [],
      send_type = "immediate",
      scheduled_at = null,
      timezone: campaignTimezone = null,
      recurring_rule = null,
      filter = {},
      forceSend = false,
      footerLocations = [],
    } = req.body;

    // Validate footer_locations
    if (footerLocations && !Array.isArray(footerLocations)) {
      return res
        .status(400)
        .json({ success: false, message: "footer_locations must be an array" });
    }

    if (
      recurring_rule &&
      !["daily", "weekly", "monthly"].includes(recurring_rule)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recurring_rule. Use "daily", "weekly", or "monthly".',
      });
    }

    if (!subject || !body) {
      return res
        .status(400)
        .json({ success: false, message: "subject and body are required" });
    }

    // --- Insert Campaign ---
    const insertCampaignSQL = `
      INSERT INTO campaigns
        (label, subject, body, from_name, from_email, reply_to_email, cc, bcc, user_id, status, scheduled_at, send_type, timezone, recurring_rule, footer_locations)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12,$13,$14)
      RETURNING campaign_id, scheduled_at
    `;

    const utcScheduledAt = scheduled_at
      ? moment.tz(scheduled_at, campaignTimezone || "UTC").toDate()
      : null;

    const campaignRes = await client.query(insertCampaignSQL, [
      label || null,
      subject,
      body,
      fromName || null,
      fromEmail || process.env.DEFAULT_FROM_EMAIL,
      replyToEmail || process.env.DEFAULT_REPLYTO,
      cc || [],
      bcc || [],
      userId,
      utcScheduledAt,
      send_type,
      campaignTimezone || null,
      recurring_rule || null,
      footerLocations ? JSON.stringify(footerLocations) : "[]",
    ]);
    const campaignId = campaignRes.rows[0].campaign_id;

    // --- Resolve Recipients ---
    const recipientsToSend = [];

    for (const email of toEmails) {
      // Check if contact exists, include unsubscribe_token
      let { rows } = await client.query(
        "SELECT contact_id, unsubscribed, unsubscribe_token FROM contacts WHERE email = $1",
        [email]
      );

      let contact_id;
      let unsubscribed = false;
      let unsubscribe_token;

      if (rows.length > 0) {
        contact_id = rows[0].contact_id;
        unsubscribed = rows[0].unsubscribed;
        unsubscribe_token = rows[0].unsubscribe_token;
      } else {
        // Create new contact if not exists
        unsubscribe_token = generateUnsubscribeToken();
        const { rows: newContact } = await client.query(
          `INSERT INTO contacts (email, unsubscribe_token) VALUES ($1, $2) RETURNING contact_id`,
          [email, unsubscribe_token]
        );
        contact_id = newContact[0].contact_id;
      }

      if (unsubscribed) {
        // Mark as skipped
        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, contact_id, status, filter_reason) 
           VALUES ($1,$2,'skipped','unsubscribed')`,
          [campaignId, contact_id]
        );
      } else {
        recipientsToSend.push({ contact_id, email, unsubscribe_token });
      }
    }

    const shouldSendNow = send_type === "immediate" || forceSend;

    if (!shouldSendNow) {
      await client.query(
        `UPDATE campaigns SET status = 'scheduled' WHERE campaign_id = $1`,
        [campaignId]
      );
      for (const r of recipientsToSend) {
        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, contact_id, status) VALUES ($1, $2, 'pending')`,
          [campaignId, r.contact_id]
        );
      }
      return res.status(200).json({
        success: true,
        message: "Campaign scheduled",
        campaignId,
        recipients_count: recipientsToSend.length,
      });
    }

    // --- Send via AWS SES ---
    const toAddresses = recipientsToSend.map((r) => r.email);

    if (!toAddresses.length) {
      return res.status(400).json({ success: false, message: "No recipients" });
    }

    // Generate footer for each recipient
    for (const recipient of recipientsToSend) {
      // --- Email Template ---
      const footerParts = [];

      // Unsubscribe section
      footerParts.push(`
    <p style="font-size: 12px; color: #666; margin: 20px 0;">
      Don’t want to receive these emails? 
      <a href="http://localhost:6300/mail-marketing-system/emails/unsubscribe?token=${recipient.unsubscribe_token}"
         style="color:#007bff; text-decoration:none;">
         Unsubscribe
      </a>
    </p>
  `);

      // Footer locations if provided
      if (footerLocations.length) {
        footerParts.push(
          `<p style="font-size: 12px; color: #666; margin: 10px 0 0;">Our Locations:</p>`
        );
        footerLocations.forEach((loc) => {
          footerParts.push(`
        <p style="font-size: 12px; color: #666; margin: 2px 0;">
          <strong>${loc.location}</strong>: ${loc.address}, ${loc.phone}
        </p>
      `);
        });
      }

      const footer = footerParts.join("");

      // Full centered template
      const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${subject}</title>
      </head>
      <body style="margin:0; padding:0; background:#f9f9f9; font-family:Arial,sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" 
                     style="background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); padding:30px; text-align:center;">
                <tr>
                  <td style="font-size:18px; line-height:1.6; color:#333333;">
                    ${body}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px; border-top:1px solid #eee;">
                    ${footer}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

      const params = {
        Destination: {
          ToAddresses: [recipient.email], // Send individually for unique unsubscribe
          CcAddresses: cc,
          BccAddresses: bcc,
        },
        Message: {
          Body: {
            Html: { Charset: "UTF-8", Data: htmlTemplate },
            Text: {
              Charset: "UTF-8",
              Data:
                body.replace(/<\/?[^>]+(>|$)/g, "") +
                "\n\nUnsubscribe: https://yourapp.com/unsubscribe?token=" +
                recipient.unsubscribe_token,
            },
          },
          Subject: { Charset: "UTF-8", Data: subject },
        },
        Source: `"${fromName || "Default Sender"}" <${
          fromEmail || process.env.DEFAULT_FROM_EMAIL
        }>`,
        ReplyToAddresses: [replyToEmail || process.env.DEFAULT_REPLYTO],
      };

      const command = new SendEmailCommand(params);
      await ses.send(command);
    }

    // --- Insert campaign_recipients after sending ---
    for (const r of recipientsToSend) {
      await client.query(
        `INSERT INTO campaign_recipients (campaign_id, contact_id, status, sent_at) 
         VALUES ($1, $2, 'sent', NOW())`,
        [campaignId, r.contact_id]
      );
    }

    await client.query(
      `UPDATE campaigns SET status = 'sent' WHERE campaign_id = $1`,
      [campaignId]
    );

    return res.status(200).json({
      success: true,
      message: `Campaign sent via AWS SES to ${recipientsToSend.length} recipients.`,
      campaignId,
      recipients: toAddresses,
    });
  } catch (error) {
    console.error("Error in sendEmailAWS:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send via SES",
      error: error.message,
    });
  }
};

//Unsubscribe
const unsubscribeEmail = async (req, res) => {
  const { token } = req.query;

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
      return res.send("You are already unsubscribed ✅");
    }

    //Update Status
    await client.query(
      "UPDATE contacts SET unsubscribed = true WHERE contact_id = $1",
      [contact.contact_id]
    );

    return res.send("You have been unsubscribed successfully 👋");
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

module.exports = {
  unsubscribeEmail,
  getEmailCampaigns,
  getEmails,
  sendEmailAWS,
};
