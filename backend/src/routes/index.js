const router = require("express").Router();

const authRoutes = require("./auth.routes");
const decisionCaseRoutes = require("./decisionCase.routes");
const criterionRoutes = require("./criterion.routes");
const alternativeRoutes = require("./alternative.routes");
const scoreRoutes = require("./score.routes");

router.get("/", (req, res) => res.send("Decisio API is running 🚀"));

router.use("/auth", authRoutes);
router.use("/decision-cases", decisionCaseRoutes);

// criterion/alternative/score pakai full path di file masing-masing
router.use("/", criterionRoutes);
router.use("/", alternativeRoutes);
router.use("/", scoreRoutes);

module.exports = router;
