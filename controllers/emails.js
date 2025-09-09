const client = require("../config/db");
const mg = require("../config/mailgunClient");
const ses = require("../config/sesClient");
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const crypto = require("crypto");

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
      scheduled_at ? new Date(scheduled_at) : null,
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
      let footer = `
        <br><hr>
        <p style="font-size: 12px; color: #666;">
          Don't want to receive these emails? 
          <a href="http://localhost:6300/mail-marketing-system/emails/unsubscribe?token=${recipient.unsubscribe_token}">Unsubscribe</a>
        </p>
      `;
      if (footerLocations.length) {
        footer += '<p style="font-size: 12px; color: #666;">Our Locations:</p>';
        footerLocations.forEach((loc) => {
          footer += `<p style="fontwow-size: 12px; color: #666;">${loc.location}: ${loc.address}, ${loc.phone}</p>`;
        });
      }

      const params = {
        Destination: {
          ToAddresses: [recipient.email], // Send individually to include unique unsubscribe link
          CcAddresses: cc,
          BccAddresses: bcc,
        },
        Message: {
          Body: {
            Html: { Charset: "UTF-8", Data: body + footer },
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
  try {
    const { rows } = await client.query(
      `UPDATE contacts SET unsubscribed = true WHERE unsubscribe_token = $1 RETURNING email`,
      [token]
    );
    if (rows.length) {
      return res
        .status(200)
        .json({ success: true, message: `Unsubscribed ${rows[0].email}` });
    }
    return res.status(404).json({ success: false, message: "Invalid token" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//MailGun
const sendEmail = async (req, res) => {
  const userId = req.userId;
  try {
    const {
      label,
      subject,
      body,
      fromName,
      fromEmail,
      replyToEmail,
      toContactIds = [],
      toEmails = [],
      cc = [],
      bcc = [],
      send_type = "immediate",
      scheduled_at = null,
      timezone: campaignTimezone = null,
      recurring_rule = null,
      filter = {},
      forceSend = false,
    } = req.body;

    // 0. Basic validation
    if (!subject || !body) {
      return res
        .status(400)
        .json({ success: false, message: "subject and body are required" });
    }

    // 1. Insert campaign
    const insertCampaignSQL = `
      INSERT INTO campaigns
        (label, subject, body, from_name, from_email, reply_to_email, cc, bcc, user_id, status, scheduled_at, send_type, timezone, recurring_rule)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12,$13)
      RETURNING campaign_id, scheduled_at
    `;

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
      scheduled_at ? new Date(scheduled_at) : null,
      send_type,
      campaignTimezone || null,
      recurring_rule || null,
    ]);

    const campaign = campaignRes.rows[0];
    const campaignId = campaign.campaign_id;

    // 2. Resolve contacts
    const whereClauses = [];
    const values = [];
    let idx = 1;

    if (Array.isArray(toContactIds) && toContactIds.length > 0) {
      whereClauses.push(`contact_id = ANY($${idx}::uuid[])`);
      values.push(toContactIds);
      idx++;
    }

    if (filter) {
      if (Array.isArray(filter.tags) && filter.tags.length > 0) {
        whereClauses.push(`tag = ANY($${idx}::varchar[])`);
        values.push(filter.tags);
        idx++;
      }
      if (filter.exclude_unsubscribed) {
        whereClauses.push(`(unsubscribed IS NULL OR unsubscribed = false)`);
      }
      if (
        filter.engaged_within_days &&
        Number.isFinite(filter.engaged_within_days)
      ) {
        whereClauses.push(
          `last_opened >= (NOW() - INTERVAL '${Number(
            filter.engaged_within_days
          )} days')`
        );
      }
      if (filter.opened_last_campaign_id) {
        whereClauses.push(`last_opened IS NOT NULL`);
      }
    }

    let contactRows = [];
    if (whereClauses.length > 0) {
      const contactsSQL = `SELECT contact_id, email, unsubscribed, tag, last_opened FROM contacts WHERE ${whereClauses.join(
        " AND "
      )}`;
      const { rows } = await client.query(contactsSQL, values);
      contactRows = rows;
    } else if (Array.isArray(toContactIds) && toContactIds.length > 0) {
      const { rows } = await client.query(
        `SELECT contact_id, email, unsubscribed, tag, last_opened FROM contacts WHERE contact_id = ANY($1::uuid[])`,
        [toContactIds]
      );
      contactRows = rows;
    }

    const resolvedContactEmails = (contactRows || []).map((r) => ({
      contact_id: r.contact_id,
      email: r.email,
      unsubscribed: r.unsubscribed,
    }));
    const rawEmailEntries = Array.isArray(toEmails)
      ? toEmails.map((e) => ({ contact_id: null, email: e }))
      : [];
    const allRecipients = resolvedContactEmails.concat(rawEmailEntries);

    // 3. Apply exclusions
    const recipientsToSend = [];
    for (const r of allRecipients) {
      if (r.contact_id && r.unsubscribed) {
        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, contact_id, status, filter_reason) VALUES ($1,$2,'skipped','unsubscribed')`,
          [campaignId, r.contact_id]
        );
      } else {
        recipientsToSend.push(r);
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

    // 4. Send with Mailgun
    const toAddresses = recipientsToSend.map((r) => r.email);
    if (!toAddresses.length) {
      return res.status(400).json({ success: false, message: "No recipients" });
    }

    const data = {
      from: `"${fromName || "Default Sender"}" <${
        fromEmail || process.env.DEFAULT_FROM_EMAIL
      }>`,
      to: toAddresses,
      subject,
      text: body.replace(/<\/?[^>]+(>|$)/g, ""),
      html: body,
      "h:Reply-To": replyToEmail || process.env.DEFAULT_REPLYTO,
      cc: cc && cc.length ? cc : undefined,
      bcc: bcc && bcc.length ? bcc : undefined,
    };

    const info = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);

    for (const r of recipientsToSend) {
      await client.query(
        `INSERT INTO campaign_recipients (campaign_id, contact_id, status, sent_at) VALUES ($1, $2, 'sent', NOW())`,
        [campaignId, r.contact_id]
      );
    }
    await client.query(
      `UPDATE campaigns SET status = 'sent' WHERE campaign_id = $1`,
      [campaignId]
    );

    return res.status(200).json({
      success: true,
      message: `Campaign sent to ${recipientsToSend.length} recipients.`,
      campaignId,
      recipients: toAddresses,
      id: info.id,
    });
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send campaign",
      error: error.message,
    });
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
  sendEmail,
  unsubscribeEmail,
  getEmailCampaigns,
  getEmails,
  sendEmailAWS,
};
