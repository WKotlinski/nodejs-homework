const { Users } = require("../models/user");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async ({ email, password }) => {
  const newUser = new Users({
    email,
    password: await bcrypt.hash(password, 10),
  });
  await newUser.save();
  return newUser;
};

const findUser = async ({ email }) => {
  const user = await Users.findOne({ email });
  if (user) {
    throw new Error("Email already taken");
  }
  return user;
};

const findById = async ({ id }) => {
  const user = Users.findById({ id });
  return user;
};

const loginUser = async ({ email, password }) => {
  const user = Users.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordGood = await bcrypt.compare(password, user.password);
  if (!isPasswordGood) {
    throw new Error("Invalid email or password");
  }
  const token = jwt.sign({ id: user.id }, process.env.SECRET, {
    expiresIn: "1h",
  });
  user.token = token;
  await user.save();
  return user;
};
module.exports = {
  findUser,
  findById,
  registerUser,
  loginUser,
};
