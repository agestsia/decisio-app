const express = require("express");
const routes = require("./routes");

const app = express();

// middleware
app.use(express.json());

// routing
app.use("/", routes);

module.exports = app;
