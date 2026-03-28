const router = require("express").Router();
const auth = require("../middlewares/auth");
const alternativeController = require("../controllers/alternative.controller");

router.post("/decision-cases/:id/alternatives", auth, alternativeController.create);
router.get("/decision-cases/:id/alternatives", auth, alternativeController.list);
router.put(
  "/decision-cases/:id/alternatives/:alternativeId",
  auth,
  alternativeController.update
);
router.delete(
  "/decision-cases/:id/alternatives/:alternativeId",
  auth,
  alternativeController.remove
);

module.exports = router;
