const express = require("express");
const router = express.Router();

/**
 * POST /api/analyze — body: { headers, rows }
 * Returns basic column stats. Mirrors frontend/js/data.js computeColumnStats()
 * so the frontend can eventually call this instead of computing locally.
 */
router.post("/", (req, res) => {
  const { headers = [], rows = [] } = req.body || {};
  const columnInfo = headers.map((h) => {
    let missing = 0;
    const unique = new Set();
    rows.forEach((r) => {
      const v = r[h];
      if (v === undefined || v === "" || v === null) missing++;
      unique.add(v);
    });
    return { name: h, missing, unique: unique.size };
  });

  res.json({
    totalRows: rows.length,
    totalColumns: headers.length,
    columnInfo,
  });
});

/** GET /api/dashboard/:id — placeholder for a saved dashboard config */
router.get("/dashboard/:id", (req, res) => {
  res.json({ id: req.params.id, message: "Dashboard config storage not implemented in this starter backend." });
});

module.exports = router;
