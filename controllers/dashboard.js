const client = require("../config/db");

// Fetch Dashboard Items
const fetchDashboard = async (req, res) => {
  const userId = req.userId;
  try {
    // Parallel
    const [contactsResult, smtpConfigsResult, campaignsResult] =
      await Promise.all([
        client.query(
          "SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
          [userId]
        ),
        client.query(
          "SELECT * FROM smtp_configs WHERE user_id = $1 ORDER BY created_at DESC",
          [userId]
        ),
        client.query(
          "SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
          [userId]
        ),
      ]);

    res.status(200).json({
      contacts: contactsResult.rows,
      smtpConfigs: smtpConfigsResult.rows,
      campaigns: campaignsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

module.exports = { fetchDashboard };
