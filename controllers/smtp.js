const client = require("../config/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

//AES Encryption
const encryptPassword = (text) => {
  const key = Buffer.from(process.env.SMTP_SECRET_KEY, "hex"); // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // store iv + data
};

//Register SMTP server
const registerSMTPServer = async (req, res) => {
  const userId = req.userId;
  try {
    const { name, smtpUser, smtpPassword, fromAddress, host, port, secure } =
      req.body;

    // Validate required fields
    if (!smtpUser || !smtpPassword || !fromAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Enforce maximum of 3 configurations
    const countConfigs = await client.query(
      "SELECT COUNT(*) FROM smtp_configs WHERE user_id = $1",
      [userId]
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
        return res
          .status(400)
          .json({
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
      from: fromAddress,
      to: fromAddress,
      subject: "SMTP Verification",
      text: "Your SMTP configuration has been verified successfully.",
    });

    // Encrypt password
    const encryptedPassword = encryptPassword(smtpPassword);

    // Insert configuration into DB
    const insertQuery = `
      INSERT INTO smtp_configs 
        (user_id, name, smtp_host, smtp_port, smtp_user, smtp_password, use_tls, from_address) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING config_id
    `;

    const values = [
      userId,
      name || null,
      smtpHost,
      smtpPort,
      smtpUser,
      encryptedPassword,
      smtpSecure,
      fromAddress,
    ];

    const result = await client.query(insertQuery, values);

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
  try {
    const result = await client.query(
      "SELECT * FROM smtp_configs WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
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
  } catch (error) {}
};

//Delete SMTP server Details
const deleteSMTPServer = async (req, res) => {
  const { smtpServerId } = req.params;
  try {
  } catch (error) {}
};

module.exports = {
  registerSMTPServer,
  getSMTPServers,
  getSMPTConfiguration,
  updateSMPTConfigurationDetails,
  deleteSMTPServer,
};
