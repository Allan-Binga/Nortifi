const client = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { sendEmailVerificationEmail } = require("./emailService")
const crypto = require("crypto");

// Joi schema for sign up
const signUpSchema = Joi.object({
  userName: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z'\-\s]{2,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Name must be at least 3 characters and contain only letters, spaces, apostrophes, or hyphens.",
    }),

  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
});

// Joi schema for login
const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8) // Enforce minimum length
    .max(128) // Prevent excessively long passwords to avoid DoS attacks
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ) // Match signup complexity
    .required(),
});

//SignUp Users
const signUp = async (req, res) => {
  const { error, value } = signUpSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { userName, email, password } = value;
  try {
    const checkUser = `SELECT * FROM users WHERE email = $1`;
    const existingUser = await client.query(checkUser, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "A user is already registered with this email. Please use another email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING user_id, username, email
    `;

    const result = await client.query(insertQuery, [
      userName,
      email,
      hashedPassword,
    ]);

    const newUser = result.rows[0]

    //Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    await client.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [newUser.user_id, verificationToken]
    )


    await sendEmailVerificationEmail(newUser.user_id, verificationToken)

    res.status(201).json({
      message: "Successful registration. Please verify your email.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("User registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Sign In Users
const signIn = async (req, res) => {
  if (req.cookies?.userMailMktSession) {
    return res.status(400).json({ message: "You are already logged in." });
  }

  const { error, value } = signInSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = value;

  try {
    const checkUser = "SELECT * FROM users WHERE email = $1";
    const user = await client.query(checkUser, [email]);

    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Invalid credentials. Please retry." });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        userId: user.rows[0].user_id,
        email: user.rows[0].email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("userMailMktSession", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    //First Login
    let redirectTo = "/home";
    if (user.is_first_login) {
      await client.query(
        `UPDATE users SET is_first_login = false WHERE user_id = $1`,
        [user.user_id]
      );
      redirectTo = "/register-smtp";
    }

    res.status(200).json({
      message: "Login successful",
      redirectTo,
      user: {
        email: user.rows[0].email,
      },
    });
  } catch (error) {
    console.error("User login error", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Sign-Out Users
const signOut = async (req, res) => {
  try {
    if (!req.cookies?.userMailMktSession) {
      return res.status(400).json({ message: "You are not logged in." });
    }
    res.clearCookie("userMailMktSession");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    res.status(500).json({ message: "Error occurred during logout." });
  }
};

module.exports = { signUp, signIn, signOut };
