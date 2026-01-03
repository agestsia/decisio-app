const router = require("express").Router();
const auth = require("../middlewares/auth");
const decisionCaseController = require("../controllers/decisionCase.controller");

router.post("/", auth, decisionCaseController.create);
router.get("/", auth, decisionCaseController.list);
router.get("/:id", auth, decisionCaseController.detail);

// ✅ NEW
router.get("/:id/scores", auth, decisionCaseController.scoreMatrix);
router.get("/:id/results", auth, decisionCaseController.results);

module.exports = router;
