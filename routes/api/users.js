const bcrypt = require("bcrypt");
const express = require("express");
const Joi = require("joi");
const { registerUser, findUser } = require("../../controllers/users_services");

const router = express.Router();

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.password().required(),
});

router.post("/signup", async (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(409).json({ message: "Missing required field" });
  }
  const user = await findUser(email);
  if (user) {
    return res.status(409).json({ message: "Email already in use" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
    };
    const createdUser = await registerUser(newUser);
    return res.status(201).json({ message: `${createdUser.email} registerd` });
  } catch (error) {
    next(error);
  }
});

router.get("/current", async (res, req, next) => {
  const { email, subscribtion } = req.body;
  const user = await findUser({ email });
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  return res.status(201).json({ email, subscribtion }); 
});

module.exports = router;
