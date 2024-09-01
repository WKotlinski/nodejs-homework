const { Users } = require("../models/user");

const registerUser = async ({ email, password }) => {
  const newUser = {
    email,
    password: bcript.hash(password),
  };
};

const loginUser = async () => {};
const findUser = async ({ email }) => {
  const user = Users.findOne({ email });
  if (user) throw new Error("Email already taken");
  return user;
};
module.exports = {
  findUser,
  registerUser,
  loginUser,
};
