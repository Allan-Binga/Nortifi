const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

//User ID
const authUser = (req, res, next) => {
  try {
    // console.log("Cookies received:", req.cookies); // Debug
    const token = req.cookies.userMailMktSession;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please login to proceed." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded JWT:", decoded); // Debug
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("JWT error:", error); // Debug
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authUser };
