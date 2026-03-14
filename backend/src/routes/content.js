/**
 * Public content routes.
 */
const express = require("express");
const appContentService = require("../services/appContentService");

const router = express.Router();

router.get("/:contentKey", async (req, res, next) => {
  try {
    const content = await appContentService.getContent(req.params.contentKey);
    return res.json(content);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Content type not found" });
    }
    return next(err);
  }
});

module.exports = router;
