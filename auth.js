const jwt = require("jsonwebtoken");
require("dotenv").config();

console.log("DEBUG SECRET =", process.env.JWT_SECRET_KEY);


module.exports.createAccessToken = (user) => {
  const data = {
    id: user._id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(data, process.env.JWT_SECRET_KEY, {
    expiresIn: "3h"
  });
};


module.exports.authenticate = (req, res, next) => {
  let header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token",
        error: err.message,
      });
    }

    req.user = decoded;
    next();
  });
};


module.exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    return res.status(403).json({
      message: "Action forbidden — Admin only"
    });
  }
};


module.exports.isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};
