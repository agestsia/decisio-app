const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("Decisio API is running 🚀");
});

module.exports = router;
