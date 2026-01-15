// src/routes/decisionCase.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth");
const decisionCaseController = require("../controllers/decisionCase.controller");

router.post("/", auth, decisionCaseController.create);
router.get("/", auth, decisionCaseController.list);

router.get("/:id/scores", auth, decisionCaseController.scoreMatrix);
router.post("/:id/compute", auth, decisionCaseController.compute);

router.get("/:id/results/latest", auth, decisionCaseController.latestResult);
router.get("/:id/history", auth, decisionCaseController.history);
router.get("/:id/results", auth, decisionCaseController.results);

router.get("/:id", auth, decisionCaseController.detail);

module.exports = router;
