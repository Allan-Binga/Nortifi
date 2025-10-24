const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path")
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const contactRoute = require("./routes/contacts");
const emailsRoute = require("./routes/emails");
const smtpRoute = require("./routes/smtp")
const dashboardRoute = require("./routes/dashboard")
const verificationRoute = require("./routes/verification")
const passwordRoute = require("./routes/password")
const websiteRoute = require("./routes/websites")
const labelsRoute = require("./routes/labels")
const { scheduleCampaigns } = require("./config/cronScheduler");
scheduleCampaigns();

//Import DB connection
require("./config/db");

dotenv.config();
const app = express();

// All other routes use JSON
app.use(express.json());

//CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://www.nortifi.com",
  "https://nortifi.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming request origin:", origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS."));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

//Cookie-parser
app.use(cookieParser());

//ROutes
app.use("/mail-marketing-system/v1/auth", authRoute);
app.use("/mail-marketing-system/v1/verification", verificationRoute)
app.use("/mail-marketing-system/v1/contacts", contactRoute);
app.use("/mail-marketing-system/v1/labels", labelsRoute);
app.use("/mail-marketing-system/v1/emails", emailsRoute);
app.use("/mail-marketing-system/v1/smtp", smtpRoute)
app.use("/mail-marketing-system/v1/dashboard", dashboardRoute)
app.use("/mail-marketing-system/v1/password", passwordRoute)
app.use("/mail-marketing-system/v1/websites", websiteRoute)

//Serve Static Files
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "frontend", "dist");
  app.use(express.static(clientDistPath));

  // Fallback for frontend routes
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/mail-marketing-system")
    ) {
      res.sendFile(path.join(clientDistPath, "index.html"));
    } else {
      next();
    }
  });
}

//Server start
const PORT = process.env.PORT || 6300;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}
