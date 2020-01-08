const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const { check, validationResult } = require("express-validator");

const bcryptjs = require("bcryptjs"); // Include Bcryptjs

const auth = require("basic-auth"); // Include Basic Auth

const { User, Course } = require("../../models");

// Async Handler Function
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      res.status(500).send({
        message: error.message
      });
    }
  };
}

// Authenticator Middleware
const authenticateUser = async (req, res, next) => {
  let message = null;
  const credentials = auth(req);

  console.log(auth(req));
  if (credentials) {
    const users = await User.findAll();
    const user = users.find(u => u.emailAddress === credentials.name);

    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );

      if (authenticated) {
        console.log(
          `Authentication successful for username: ${credentials.name}`
        );

        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${credentials.name}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = "Auth header not found";
  }
  if (message) {
    console.warn(message);

    res.status(401).json({ message: "Access Denied" });
  } else {
    next();
  }
};

// GET /api/users 200 - Returns the currently authenticated user
router.get("/", authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    name: user.firstName,
    username: user.lastName
  });
});

// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.body;
    user.password = bcryptjs.hashSync(user.password);
    await User.create(user);
    res
      .status(201)
      .json({
        message: "user created",
        user: user
      })
      .end();
  })
);

// DELETE /api/users 200 - Deletes user from DB
router.delete(
  "/:userId",
  asyncHandler(async (req, res) => {
    let { userId } = req.params;
    const user = await User.findByPk(userId);
    user
      ? user.destroy().then(() => {
          res.status(204).send();
        })
      : res.status(404).send("The record your looking for does not exist");
  })
);

module.exports = router;
