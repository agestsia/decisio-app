// src/routes/index.js
const router = require("express").Router();

const authRoutes = require("./auth.routes");
const decisionCaseRoutes = require("./decisionCase.routes");
const decisionResultRoutes = require("./decisionResult.routes");

const criterionRoutes = require("./criterion.routes");
const alternativeRoutes = require("./alternative.routes");
const scoreRoutes = require("./score.routes");

router.get("/", (req, res) => res.send("Decisio API is running 🚀"));

router.use("/auth", authRoutes);
router.use("/decision-cases", decisionCaseRoutes);
router.use("/decision-results", decisionResultRoutes);

router.use("/", criterionRoutes);
router.use("/", alternativeRoutes);
router.use("/", scoreRoutes);

module.exports = router;
