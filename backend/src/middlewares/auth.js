const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "missing Authorization header" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "invalid Authorization format" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");

    const payload = jwt.verify(token, secret);
    req.user = payload; // { id, email, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ message: "unauthorized" });
  }
};
