const client = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Joi = require("joi");
const { serverRegistrationEmail } = require("./emailService");

//AES Encryption
const encryptPassword = (text) => {
  const key = Buffer.from(process.env.SMTP_SECRET_KEY, "hex"); // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // store iv + data
};

//SMTP Validation Schema
const smtpSchema = Joi.object({
  websiteId: Joi.string().uuid().required(),
  name: Joi.string().max(100).optional(),

  smtpUser: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),

  smtpPassword: Joi.string().min(4).required(),

  host: Joi.string().hostname().optional(),

  port: Joi.number().integer().min(1).max(65535).optional(),

  secure: Joi.boolean().optional(),

  testEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .optional(),
});

// Register SMTP server
const registerSMTPServer = async (req, res) => {
  const userId = req.userId;
  try {
    // Validate request body
    const { error, value } = smtpSchema.validate(req.body, {
      abortEarly: false, // collect all errors
      stripUnknown: true, // remove unexpected fields
    });

    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join(", "),
      });
    }

    // Destructure the validated payload
    const { websiteId, name, smtpUser, smtpPassword, host, port, secure, testEmail } =
      value;

    // Verify website ownership
    const websiteCheck = await client.query(
      "SELECT * FROM websites WHERE website_id = $1 AND user_id = $2",
      [websiteId, userId]
    );

    if (websiteCheck.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized website access" });
    }

    // Enforce maximum of 3 configurations
    const countConfigs = await client.query(
      "SELECT COUNT(*) FROM smtp_configs WHERE website_id = $1",
      [websiteId]
    );
    if (parseInt(countConfigs.rows[0].count) >= 3) {
      return res
        .status(400)
        .json({ error: "Maximum of 3 SMTP configurations allowed" });
    }

    // Provider map
    const smtpProviders = {
      "gmail.com": { host: "smtp.gmail.com", port: 587, secure: false },
      "outlook.com": { host: "smtp.office365.com", port: 587, secure: false },
      "yahoo.com": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
      "zoho.com": { host: "smtp.zoho.com", port: 465, secure: true },
    };

    // Use provided host if given, else fall back to provider map
    let smtpHost = host;
    let smtpPort = port;
    let smtpSecure = secure;

    if (!smtpHost) {
      const domain = smtpUser.split("@")[1];
      const providerConfiguration = smtpProviders[domain];
      if (!providerConfiguration) {
        return res.status(400).json({
          error:
            "Unsupported email provider. Please provide host/port manually.",
        });
      }
      smtpHost = providerConfiguration.host;
      smtpPort = providerConfiguration.port;
      smtpSecure = providerConfiguration.secure;
    }

    // Verify credentials with Nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      name: "Nortify",
      from: smtpUser,
      to: testEmail,
      subject: "SMTP Verification",
      text: "Your SMTP configuration has been verified successfully.",
    });

    // Encrypt password
    const encryptedPassword = encryptPassword(smtpPassword);

    // Insert configuration into DB
    const insertQuery = `
      INSERT INTO smtp_configs 
        (user_id, website_id, name, smtp_host, smtp_port, smtp_user, smtp_password, use_tls) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING config_id
    `;

    const values = [
      userId,
      websiteId,
      name || null,
      smtpHost,
      smtpPort,
      smtpUser,
      encryptedPassword,
      smtpSecure,
    ];

    const result = await client.query(insertQuery, values);

    //Sends Server Registration Email
    serverRegistrationEmail(userId).catch((err) => {
      console.error("Background SES send failed:", err.message);
    });

    res.status(201).json({
      success: true,
      configId: result.rows[0].config_id,
      message: "SMTP configuration verified and saved.",
    });
  } catch (error) {
    console.error("Error registering SMTP:", error);
    res.status(500).json({ error: error.message });
  }
};

//Fetch SMPT server
const getSMTPServers = async (req, res) => {
  const userId = req.userId;
  const { websiteId } = req.params;

  try {
    let result;
    if (websiteId) {
      result = await client.query(
        "SELECT * FROM smtp_configs WHERE user_id = $1 AND website_id = $2 ORDER BY created_at DESC",
        [userId, websiteId]
      );
    } else {
      result = await client.query(
        "SELECT * FROM smtp_configs WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching SMTP servers:", error);
    res.status(500).json({ error: "Failed to fetch SMTP servers" });
  }
};

//Fetch SMPT server Details
const getSMPTConfiguration = async (req, res) => {
  const userId = req.userId;
  const { smtpServerId } = req.params;
  try {
    const result = await client.query(
      "SELECT * FROM smtp_configs WHERE user_id = $1 AND config_id = $2 ORDER BY created_at DESC",
      [userId, smtpServerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "SMTP configuration not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching SMTP configuration:", error);
    res.status(500).json({ error: "Failed to fetch SMTP configuration" });
  }
};

//Update SMTP server Details
const updateSMPTConfigurationDetails = async (req, res) => {
  const { smtpServerId } = req.params;
  try {
  } catch (error) { }
};

//Delete SMTP server Details
const deleteSMTPServer = async (req, res) => {
  const { smtpServerId } = req.params;
  try {
  } catch (error) { }
};

module.exports = {
  registerSMTPServer,
  getSMTPServers,
  getSMPTConfiguration,
  updateSMPTConfigurationDetails,
  deleteSMTPServer,
};
