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
      res.status(500).json({
        message: error.message
      });
    }
  };
}

// Authenticator Middleware
const authenticateUser = async (req, res, next) => {
  let message = null;
  const credentials = auth(req);
  // Hide log of auth test input
  //   console.log(auth(req));
  if (credentials) {
    const users = await User.findAll();
    const user = users.find(u => u.emailAddress === credentials.name);

    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );

      if (authenticated) {
        // Hide log to show successful login on server
        // console.log(
        //   `Authentication successful for username: ${credentials.name}`
        // );

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

    res.status(401).json({
      message:
        "Access Denied - You must be a Registered User to access this API"
    });
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
  [
    check("firstName")
      .exists()
      .withMessage('Please Provide a value for "firstName"'),
    check("lastName")
      .exists()
      .withMessage('Please Provide a value for "lastName"'),
    check("emailAddress")
      .isEmail()
      .withMessage('Please Provide a valid "emailAddress"')
      .exists()
      .withMessage('Please Provide a value for "emailAddress"'),
    check("password")
      .isLength({ min: 8, max: 20 })
      .withMessage('Please Provide a "password" between (8 - 20) characters')
      .exists()
      .withMessage('Please Provide a value for "password"')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Use the Array `map()` method to get a list of error messages.
      const errorMessages = errors.array().map(error => error.msg);

      // Return the validation errors to the client.
      res
        .status(422)
        .json({
          location: "body",
          message: "Invalid User Entry",
          errors: errorMessages
        });
    } else {
      //Search users for existing users emailAddress to make sure it doesn't exist
      const userExists = await User.findAll({
        where: {
          emailAddress: {
            [Op.like]: req.body.emailAddress
          }
        }
      });
      if (userExists.length < 1) {
        // Get the user from the request body.
        const user = User.build({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          emailAddress: req.body.emailAddress,
          password: req.body.password
        });
        // Use Bcryptjs to encrypt the password
        user.password = bcryptjs.hashSync(user.password);
        // Saves the user record and saves it to DB
        user.save().catch(error => {
          // Logs errors caught
          console.log(error);
        });
        res.setHeader("Location", "/");
        res.status(201).json();
      } else if (userExists) {
        res.status(422).json({ message: "User already exists" });
      }
    }
  })
);

module.exports = router;
