const cron = require("node-cron");
const client = require("./db");
const ses = require("./sesClient");
const { SendEmailCommand } = require("@aws-sdk/client-ses");

const scheduleCampaigns = async () => {
  // Run every minute to check for due campaigns
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
        } = campaign;
        console.log(footer_locations);

        // Parse footer_locations JSON if it’s stored as string
        let parsedFooterLocations = [];
        if (footer_locations) {
          if (typeof footer_locations === "string") {
            try {
              parsedFooterLocations = JSON.parse(footer_locations);
            } catch (e) {
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
            // First send → respect scheduled_at
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

        // --- Send if due ---
        if (shouldSend) {
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
            for (const recipient of recipients) {
              let footer = `
                <br><hr>
                <p style="font-size: 12px; color: #666;">
                  Don't want to receive these emails? 
                  <a href="https://yourapp.com/unsubscribe?token=${recipient.unsubscribe_token}">Unsubscribe</a>
                </p>
              `;

              if (parsedFooterLocations.length) {
                footer +=
                  '<p style="font-size: 12px; color: #666;">Our Locations:</p>';
                parsedFooterLocations.forEach((loc) => {
                  footer += `<p style="font-size: 12px; color: #666;">${loc.location}: ${loc.address}, ${loc.phone}</p>`;
                });
              }

              const params = {
                Destination: {
                  ToAddresses: [recipient.email],
                  CcAddresses: campaign.cc || [],
                  BccAddresses: campaign.bcc || [],
                },
                Message: {
                  Body: {
                    Html: { Charset: "UTF-8", Data: campaign.body + footer },
                    Text: {
                      Charset: "UTF-8",
                      Data:
                        campaign.body.replace(/<\/?[^>]+(>|$)/g, "") +
                        "\n\nUnsubscribe: https://yourapp.com/unsubscribe?token=" +
                        recipient.unsubscribe_token,
                    },
                  },
                  Subject: { Charset: "UTF-8", Data: campaign.subject },
                },
                Source: `"${campaign.from_name || "Default Sender"}" <${
                  campaign.from_email || process.env.DEFAULT_FROM_EMAIL
                }>`,
                ReplyToAddresses: [
                  campaign.reply_to_email || process.env.DEFAULT_REPLYTO,
                ],
              };

              const command = new SendEmailCommand(params);
              await ses.send(command);

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
