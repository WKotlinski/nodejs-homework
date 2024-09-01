const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const Joi = require("joi");
const {
  registerUser,
  findUser,
  findById,
} = require("../../controllers/users_services");

const router = express.Router();

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Auth

const auth = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findById(id);

    if (!user || user.token !== token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// Register
router.post("/signup", async (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(409).json({ message: "Missing required field" });
  }

  try {
    const user = await findUser({ email });
    if (user) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const createdUser = await registerUser({ email, password });
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        email: createdUser.email,
        subscription: createdUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await findUser(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});
// Logout
router.post("/logout", async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/current", auth, async (req, res, next) => {
  const { email, subscribtion } = req.body;
  const user = await findUser({ email });
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  return res.status(201).json({ email, subscribtion });
});

module.exports = router;
