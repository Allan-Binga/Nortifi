const client = require("../config/db")

//Verify token sent in verification email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Look up token in email_verifications table
        const query = `
      SELECT ev.user_id, ev.expires_at, u.is_verified
      FROM email_verifications ev
      JOIN users u ON ev.user_id = u.user_id
      WHERE ev.token = $1
      LIMIT 1
    `;

        const result = await client.query(query, [token]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const { user_id, expires_at, is_verified } = result.rows[0];

        if (is_verified) {
            return res.status(200).json({ message: "Account verified successfully." });
        }

        if (new Date(expires_at) < new Date()) {
            return res.status(400).json({
                message: "Token expired. Please request a new verification email.",
            });
        }

        // Mark user as verified
        await client.query(
            `UPDATE users
       SET is_verified = true
       WHERE user_id = $1`,
            [user_id]
        );

        res.json({ message: "Account verified successfully." });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { verifyEmail }