const jwt = require("jsonwebtoken");
const { findById } = require("../controllers/users_services");
require("dotenv").config();

// Auth
const auth = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (decodedToken.exp * 1000 < Date.now()) {
      return res.status(401).json({ message: "Token expired" });
    }
    const user = await findById(decodedToken.id);

    if (!user || user.token !== token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { auth };
