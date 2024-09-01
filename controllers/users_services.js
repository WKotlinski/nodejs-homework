const { Users } = require("../models/user");
const bcript = require("bcrypt");

const registerUser = async ({ email, password }) => {
  const newUser = new Users({
    email,
    password: await bcript.hash(password, 10),
  });
  await newUser.save();
  return newUser;
};

const findUser = async ({ email }) => {
  const user = Users.findOne({ email });
  if (user) throw new Error("Email already taken");
  return user;
};
const findById = async ({ id }) => {
  const user = Users.findById({ id });
  return user;
};

const loginUser = async () => {};
module.exports = {
  findUser,
  findById,
  registerUser,
  loginUser,
};
