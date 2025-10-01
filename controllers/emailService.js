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
      Source: "noreply@nortifi.com", // must be verified in SES
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

const sendEmailVerificationEmail = async (userId, verificationToken) => {
  try {
    // Fetch user’s email
    const query = "SELECT email FROM users WHERE user_id = $1 LIMIT 1";
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    const userEmail = result.rows[0].email;

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`

    // Construct SES email params
    const params = {
      Source: "noreply@nortifi.com", // SES verified sender
      Destination: {
        ToAddresses: [userEmail],
      },
      Message: {
        Subject: {
          Data: "Verify your Nortifi account",
        },
        Body: {
          Html: {
            Data: `
              <p>Hello,</p>
              <p>Thank you for signing up with Nortifi.</p>
              <p>Please verify your email address by clicking the link below:</p>
              <p><a href="${verificationLink}">Verify Email</a></p>
              <p>If you did not sign up, please ignore this email.</p>
              <p>- The Nortifi Team</p>
            `,
          },
          Text: {
            Data: `Hello,

Thank you for signing up with Nortifi.

Please verify your email address by visiting the following link:
${verificationLink}

If you did not sign up, please ignore this email.

- The Nortifi Team`,
          },
        },
      },
    };

    //Send with SES
    const command = new SendEmailCommand(params)
    await ses.send(command)
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    throw error;
  }
}

const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`

    const params = {
      Source: "noreply@nortifi.com",
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: "Reset your Nortifi account password",
        },
        Body: {
          Html: {
            Data: `
              <p>Hello,</p>
              <p>We received a request to reset your Nortifi account password.</p>
              <p>Please reset your password by clicking the link below (valid for 5 minutes):</p>
              <p><a href="${resetLink}">Reset Password</a></p>
              <p>If you did not request this, please ignore this email.</p>
              <p>- The Nortifi Team</p>
            `,
          },
          Text: {
            Data: `Hello,

We received a request to reset your Nortifi account password.

Please reset your password by visiting the following link (valid for 5 minutes):
${resetLink}

If you did not request this, please ignore this email.

- The Nortifi Team`,
          },
        },
      },
    };

    const command = new SendEmailCommand(params)
    await ses.send(command)

  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    throw error;
  }
}

module.exports = { serverRegistrationEmail, sendEmailVerificationEmail, sendPasswordResetEmail };
