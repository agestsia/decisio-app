const router = require("express").Router();
const auth = require("../middlewares/auth");
const criterionController = require("../controllers/criterion.controller");

// semuanya protected
router.post("/decision-cases/:id/criteria", auth, criterionController.create);
router.get("/decision-cases/:id/criteria", auth, criterionController.list);
router.put("/decision-cases/:id/criteria/:criterionId", auth, criterionController.update);
router.delete("/decision-cases/:id/criteria/:criterionId", auth, criterionController.remove);

module.exports = router;
