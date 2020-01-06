const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const { check, validationResult } = require("express-validator");

const bcryptjs = require("bcryptjs"); // Include Bcryptjs

const auth = require("basic-auth"); // Include Basic Auth

const { User, Course } = require("../models");

const bodyParser = require("body-parser");
const jsonParse = bodyParser.json();

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
router.get("/users", authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    name: user.firstName,
    username: user.lastName
  });
});

// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post(
  "/users",
  jsonParse,
  asyncHandler(async (req, res) => {
    const user = req.body;
    user.password = bcryptjs.hashSync(user.password);
    await User.create(user);
    res
      .status(201)
      .send("user created")
      .end();
  })
);

// DELETE /api/users 200 - Deletes user from DB
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    let { id } = req.params;
    const user = await User.findByPk(id);
    user
      ? user.destroy().then(() => {
          res.status(204).send();
        })
      : res.status(404).send("The record your looking for does not exist");
  })
);

// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll();
    res.json(courses);
  })
);

// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    let { id } = req.params;
    const course = await Course.findByPk(id);
    course
      ? res.json(course)
      : res
          .status(404)
          .send(
            "The course was not found. Either the course doesn't exist or there has been an error in your request."
          );
  })
);

// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post(
  "/courses",
  authenticateUser,
  jsonParse,
  asyncHandler(async (req, res) => {
    const course = await Course.create(req.body);
    course
      ? res.json(course)
      : res
          .status(404)
          .send(
            "There has been an error while looking for the courses results."
          );
  })
);

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    let { id } = req.params;
    const course = await Course.findByPk(id);
    course
      ? res.json(course)
      : res
          .status(404)
          .send(
            "The course was not found. Either the course doesn't exist or there has been an error in your request."
          );
  })
);

// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    let { id } = req.params;
    const course = await Course.findByPk(id);
    course
      ? course.destroy().then(() => {
          res.status(204).send();
        })
      : res.status(404).send("The record your looking for does not exist");
  })
);

module.exports = router;
