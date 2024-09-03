require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const cors = require("cors");
const { DB_HOST: urlDb, PORT } = process.env;
const connection = mongoose.connect(urlDb);

const contactsRouter = require("./routes/api/contacts");
const usersRouter = require("./routes/api/users");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Not found ${req.path}}` });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message || "Sth broke !" });
  } else {
    res.status(500).json({ message: err.message || "Sth broke !" });
  }
});

const startServer = async () => {
  try {
    await connection;
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`Best node serwer in the world in running on ${PORT}`);
    });
  } catch (err) {
    console.log(err);
    process.env(1);
  }
};
startServer();
module.exports = app;
