const client = require("../config/db")
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("./emailService")

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        // Check if user exists
        const result = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Generate a password reset token
        const plainToken = crypto.randomBytes(128).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(plainToken)
            .digest("hex");
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 2 mins

        // Store hashed token and expiry in DB
        await client.query(
            "UPDATE users SET password_reset_token = $1, password_reset_token_expiry = $2 WHERE email = $3",
            [hashedToken, expiry, email]
        );

        // Send email with plain token
        await sendPasswordResetEmail(email, plainToken);

        res.status(200).json({ message: "Password reset email sent." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Reset Password with Token (for tenants)
const resetUserPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Token, new password, and confirm password are required.",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirm password do not match.",
            });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.",
            });
        }

        // Hash the token to match what's stored
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with valid token and expiry
        const result = await client.query(
            `SELECT * FROM users
         WHERE password_reset_token = $1 AND password_reset_token_expiry > NOW()`,
            [hashedToken]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset fields
        await client.query(
            `UPDATE user
         SET password_hash = $1, password_reset_token = NULL, password_reset_token_expiry = NULL
         WHERE user_id = $2`,
            [hashedPassword, user.user_id]
        );

        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (error) {
        console.error("Error resetting password with token:", error);
        res.status(500).json({ message: "Error resetting password." });
    }
};

//Verify Password Reset Token
const verifyPasswordResetToken = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Token is required." });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const result = await client.query(
            `SELECT email, password_reset_token_expiry 
             FROM users 
             WHERE password_reset_token = $1`,
            [hashedToken]
        );

        const user = result.rows[0]


        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        if (new Date(user.password_reset_token_expiry) < new Date()) {
            return res.status(400).json({
                message: "Password reset token expired. Please request a new one."
            })
        }

        res.status(200).json({ message: "Toen is valid.", email: user.email })

    } catch (error) {

    }
}

//Resend Password Reset Email
const resendPasswordReset = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        //Check if User exists
        const result = await client.query(
            "SELECT * FROM users WHERE email = $1", [email]
        )

        const user = result.rows[0]

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Generate and store a new token and expiry
        const plainToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(plainToken)
            .digest("hex");
        const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

        await client.query(
            `UPDATE users 
             SET password_reset_token = $1, password_reset_token_expiry = $2 
             WHERE email = $3`,
            [hashedToken, expiry, email]
        )

        await sendPasswordResetEmail(email, plainToken)
        res.json({ message: "New password reset email sent." });
    } catch (error) {
        console.error("Error resending password reset email:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

module.exports = { resetPassword, resetUserPassword, verifyPasswordResetToken, resendPasswordReset }