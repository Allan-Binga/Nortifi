const cron = require("node-cron");
const client = require("./db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

const scheduleCampaigns = async () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const { rows: campaigns } = await client.query(
        `
        SELECT * FROM campaigns
        WHERE status = 'scheduled'
        AND (
          (send_type = 'scheduled' AND scheduled_at <= $1)
          OR (recurring_rule IN ('daily', 'weekly', 'monthly'))
        )
      `,
        [now]
      );

      for (const campaign of campaigns) {
        const {
          campaign_id,
          recurring_rule,
          scheduled_at,
          timezone,
          footer_locations,
          send_type,
          smtp_config_id,
        } = campaign;

        // Parse footer_locations
        let parsedFooterLocations = [];
        if (footer_locations) {
          if (typeof footer_locations === "string") {
            try {
              parsedFooterLocations = JSON.parse(footer_locations);
            } catch {
              parsedFooterLocations = [];
            }
          } else if (Array.isArray(footer_locations)) {
            parsedFooterLocations = footer_locations;
          }
        }

        // --- Check if campaign should send ---
        let shouldSend = false;
        const nowInTimezone = new Date(
          new Date().toLocaleString("en-US", {
            timeZone: timezone || "Africa/Nairobi",
          })
        );

        if (recurring_rule) {
          if (!campaign.last_sent) {
            shouldSend = nowInTimezone >= new Date(scheduled_at);
          } else {
            const lastSentDate = new Date(campaign.last_sent);
            if (recurring_rule === "daily") {
              shouldSend =
                nowInTimezone >=
                new Date(lastSentDate.getTime() + 24 * 60 * 60 * 1000);
            } else if (recurring_rule === "weekly") {
              shouldSend =
                nowInTimezone >=
                new Date(lastSentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (recurring_rule === "monthly") {
              const monthLater = new Date(lastSentDate);
              monthLater.setMonth(monthLater.getMonth() + 1);
              shouldSend = nowInTimezone >= monthLater;
            }
          }
        } else if (send_type === "scheduled" && now >= new Date(scheduled_at)) {
          shouldSend = true;
        }

        if (shouldSend) {
          // --- Get recipients ---
          const { rows: recipients } = await client.query(
            `
            SELECT c.email, cr.contact_id, c.unsubscribe_token
            FROM campaign_recipients cr
            JOIN contacts c ON cr.contact_id = c.contact_id
            WHERE cr.campaign_id = $1 AND cr.status = 'pending'
          `,
            [campaign_id]
          );

          if (recipients.length) {
            // --- Load SMTP config for this campaign ---
            const { rows: smtpRows } = await client.query(
              `SELECT * FROM smtp_configs WHERE config_id = $1`,
              [smtp_config_id]
            );

            if (!smtpRows.length) {
              console.error(
                `No SMTP config found for campaign ${campaign_id}, skipping.`
              );
              continue;
            }

            const smtpConfig = smtpRows[0];
            const smtpPassword = decryptPassword(smtpConfig.smtp_password);

            const transporter = nodemailer.createTransport({
              host: smtpConfig.smtp_host,
              port: smtpConfig.smtp_port,
              secure: smtpConfig.use_tls,
              auth: {
                user: smtpConfig.smtp_user,
                pass: smtpPassword,
              },
            });

            // --- Send mails ---
            for (const recipient of recipients) {
              let footer = `
                <br><hr>
                <p style="font-size: 12px; color: #666;">
                  Don't want to receive these emails? 
                  <a href="https://yourapp.com/unsubscribe?token=${recipient.unsubscribe_token}">Unsubscribe</a>
                </p>
              `;

              if (parsedFooterLocations.length) {
                parsedFooterLocations.forEach((loc) => {
                  footer += `<p style="font-size: 12px; color: #666;">
                    <strong>${loc.location}</strong>: ${loc.address}, ${loc.phone}
                  </p>`;
                });
              }

              const htmlTemplate = `<div>${campaign.body}${footer}</div>`;

              await transporter.sendMail({
                from: {
                  name: campaign.from_name || "Default Sender",
                  address: campaign.from_email || smtpConfig.smtp_user,
                },
                to: recipient.email,
                cc: campaign.cc || [],
                bcc: campaign.bcc || [],
                subject: campaign.subject,
                html: htmlTemplate,
                text:
                  campaign.body.replace(/<\/?[^>]+(>|$)/g, "") +
                  "\n\nUnsubscribe: https://yourapp.com/unsubscribe?token=" +
                  recipient.unsubscribe_token,
                replyTo: campaign.reply_to_email || smtpConfig.smtp_user,
              });

              await client.query(
                `
                UPDATE campaign_recipients
                SET status = 'sent', sent_at = NOW()
                WHERE campaign_id = $1 AND contact_id = $2
              `,
                [campaign_id, recipient.contact_id]
              );
            }

            if (recurring_rule) {
              await client.query(
                `UPDATE campaigns SET last_sent = NOW() WHERE campaign_id = $1`,
                [campaign_id]
              );
            } else {
              await client.query(
                `UPDATE campaigns SET status = 'sent' WHERE campaign_id = $1`,
                [campaign_id]
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Cron error:", error);
    }
  });
};

module.exports = { scheduleCampaigns };
