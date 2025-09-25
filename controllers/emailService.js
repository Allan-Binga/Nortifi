const client = require("../config/db");
const ses = require("../config/sesClient");
const { SendEmailCommand } = require("@aws-sdk/client-ses");

const serverRegistrationEmail = async (userId) => {
  try {
    //Get User email from DB
    const query = "SELECT email FROM users WHERE user_id = $1 LIMIT 1";
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const userEmail = result.rows[0].email;

    // Construct SES email params
    const params = {
      Source: "no-reply@nortifi.com", // must be verified in SES
      Destination: {
        ToAddresses: [userEmail],
      },
      Message: {
        Subject: {
          Data: "Your SMTP server has been registered",
        },
        Body: {
          Text: {
            Data: `Hello,

Your SMTP configuration has been successfully registered with Nortifi. 


- The Nortifi Team`,
          },
        },
      },
    };

    // Send with SES
    const command = new SendEmailCommand(params);
    await ses.send(command);
  } catch (error) {
    console.error("Error sending SES email:", error.message);
    throw error; // bubble up to caller
  }
};

module.exports = { serverRegistrationEmail };
