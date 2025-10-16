const client = require("../config/db")

//Add a Label
const newLabel = async (req, res) => {
    const userId = req.userId;
    const { name, color } = req.body;

    try {
        const query = `
      INSERT INTO labels (user_id, name, color)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
        const result = await client.query(query, [userId, name, color]);
        res.status(201).json({ success: true, label: result.rows[0] });
    } catch (error) {
        console.error("Error creating label:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


//Fetch Labels
const getLabels = async (req, res) => {
    const userId = req.userId;
    try {
        const query = `SELECT * FROM labels WHERE user_id = $1 ORDER BY created_at DESC;`;
        const result = await client.query(query, [userId]);
        res.status(200).json({ success: true, labels: result.rows });
    } catch (error) {
        console.error("Error fetching labels:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


//Edit/Update Label
const updateLabel = async (req, res) => {
    const userId = req.userId;
    const { labelId } = req.params;
    const { name, color } = req.body;

    try {
        const query = `
      UPDATE labels
      SET name = COALESCE($1, name),
          color = COALESCE($2, color),
          updated_at = NOW()
      WHERE label_id = $3 AND user_id = $4
      RETURNING *;
    `;
        const result = await client.query(query, [name, color, labelId, userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: "Label not found" });

        res.status(200).json({ success: true, label: result.rows[0] });
    } catch (error) {
        console.error("Error updating label:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


//Delete Labels
const deleteLabel = async (req, res) => {
    const userId = req.userId;
    const { labelId } = req.params;

    try {
        const query = `
      DELETE FROM labels
      WHERE label_id = $1 AND user_id = $2
      RETURNING *;
    `;
        const result = await client.query(query, [labelId, userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ success: false, message: "Label not found" });

        res.status(200).json({ success: true, message: "Label deleted successfully" });
    } catch (error) {
        console.error("Error deleting label:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



module.exports = { newLabel, getLabels, updateLabel, deleteLabel }