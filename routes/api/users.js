const express = require("express");
const Joi = require("joi");
const multer = require("multer");
const jimp = require("jimp");
const path = require("node:path");
const fs = require("node:fs");
require("dotenv").config();

const {
  registerUser,
  findUser,
  loginUser,
  findByIdAndAvatarUpdate,
} = require("../../controllers/users_services");
const { sendMail } = require("../../email");
const { Users } = require("../../models/user");
const { auth } = require("../../config/auth");

const router = express.Router();

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const update = multer(storage);

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
    const html = `<p>Hello, here is your verification <a href=http://localhost:${process.env.PORT}/api/users/verify/${user.verificationToken}></a>link</p>`;
    await sendMail(email, "Registraction", html);
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

// Verification
router.get("/verify/:verificationToken", auth, async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await Users.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.verificationToken = null;
    user.verify = true;
    await user.save();
    return res.status(200).json({ message: "Verification successful" });
  } catch (e) {
    next(e);
  }
});

// Verify
router.post("/verify", async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  try {
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const html = `<p>Hello, here is your verification <a href=http://localhost:${PORT}/api/users//verify/${user.verificationToken}></a>link</p>`;

    await sendMail(email, "Verify your email please", html);
    res.status(200).json({ message: "Verification email sent" });
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
    const user = await loginUser({ email, password });

    return res.status(200).json({
      token: user.token,
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
router.post("/logout", auth, async (req, res, next) => {
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

// Current
router.get(
  "/current",
  auth,
  update.single("avatar"),
  async (req, res, next) => {
    const { email, subscribtion } = req.body;
    const user = await findUser({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.status(201).json({ email, subscribtion });
  }
);

// Avatar patch
router.patch(
  "/avatars",
  auth,
  update.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { path: tempPath, originalname } = req.file;
      if (!tempPath || !originalname) {
        return res.status(400).json({ message: "File name is missing" });
      }
      const extension = path.extname(originalname).toLowerCase();
      const fileName = `${req.user._id}${extension}`;
      const newPath = path.join(__dirname, "../../public/avatars", fileName);

      const img = await jimp.read(tempPath);
      await img.resize(250, 250).writeAsync(newPath);

      try {
        await fs.unlink(tempPath);
      } catch (unlingError) {
        console.log("Error deleting temp file", unlingError);
        return res
          .status(500)
          .json({ message: "Error cleaning up temporary file" });
      }

      const avatarURL = `/avatars/${fileName}`;
      await findByIdAndAvatarUpdate(req.user._id, avatarURL);
      res.status(200).json({ avatarURL });
    } catch (e) {
      return next(e);
    }
  }
);
module.exports = router;
