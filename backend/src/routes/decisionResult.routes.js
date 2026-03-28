// src/routes/decisionResult.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth");
const decisionCaseController = require("../controllers/decisionCase.controller");

// GET /decision-results/:resultId
router.get("/:resultId", auth, decisionCaseController.resultDetail);

module.exports = router;
