const router = require("express").Router();
const auth = require("../middlewares/auth");
const scoreController = require("../controllers/score.controller");

router.put("/scores", auth, scoreController.upsert);

module.exports = router;
