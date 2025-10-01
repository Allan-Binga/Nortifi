const client = require("../config/db");

// Register Website
const addWebsite = async (req, res) => {
    const userId = req.userId;
    try {
        const { companyName, domain, field } = req.body;

        if (!companyName || !domain) {
            return res.status(400).json({ error: "Company name and domain are required" });
        }

        const insertQuery = `
      INSERT INTO websites (user_id, company_name, domain, field)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [userId, companyName, domain, field || null];

        const result = await client.query(insertQuery, values);
        res.status(201).json({
            success: true,
            website: result.rows[0],
            message: "Website added successfully",
        });
    } catch (error) {
        console.error("Error adding website:", error);
        if (error.code === "23505") { // unique violation
            return res.status(400).json({ error: "Domain already exists" });
        }
        res.status(500).json({ error: "Failed to add website" });
    }
};

// Update Website
const updateWebsite = async (req, res) => {
    const userId = req.userId;
    const { websiteId } = req.params;
    try {
        const { company_name, domain, field } = req.body;

        // Check ownership
        const checkQuery = `SELECT * FROM websites WHERE website_id = $1 AND user_id = $2`;
        const checkResult = await client.query(checkQuery, [websiteId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Website not found or unauthorized" });
        }

        const updateQuery = `
      UPDATE websites
      SET company_name = $1,
          domain = $2,
          field = $3,
          updated_at = NOW()
      WHERE website_id = $4
      RETURNING *
    `;
        const values = [company_name, domain, field, websiteId];
        const result = await client.query(updateQuery, values);

        res.status(200).json({
            success: true,
            website: result.rows[0],
            message: "Website updated successfully",
        });
    } catch (error) {
        console.error("Error updating website:", error);
        if (error.code === "23505") {
            return res.status(400).json({ error: "Domain already exists" });
        }
        res.status(500).json({ error: "Failed to update website" });
    }
};

// Delete Website
const deleteWebsite = async (req, res) => {
    const userId = req.userId;
    const { websiteId } = req.params;
    try {
        // Check ownership
        const checkQuery = `SELECT * FROM websites WHERE website_id = $1 AND user_id = $2`;
        const checkResult = await client.query(checkQuery, [websiteId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Website not found or unauthorized" });
        }

        const deleteQuery = `DELETE FROM websites WHERE website_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [websiteId]);

        res.status(200).json({
            success: true,
            website: result.rows[0],
            message: "Website deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting website:", error);
        res.status(500).json({ error: "Failed to delete website" });
    }
};

module.exports = { addWebsite, updateWebsite, deleteWebsite };
