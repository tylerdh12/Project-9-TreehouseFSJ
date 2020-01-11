const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const { User, Course } = require("../../models");

const { check, validationResult } = require("express-validator");

const bcryptjs = require("bcryptjs"); // Include Bcryptjs
const auth = require("basic-auth"); // Include Basic Auth

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

  console.log(auth(req));
  if (credentials) {
    const users = await User.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
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

// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          as: "owner",
          attributes: { exclude: ["password", "createdAt", "updatedAt"] }
        }
      ]
    });
    courses
      ? res.status(200).json(courses)
      : res.status(404).json({ message: "Unable to find the courses" });
  })
);

// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get(
  "/:courseId",
  asyncHandler(async (req, res) => {
    let { courseId } = req.params;
    const course = await Course.findByPk(courseId, {
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          as: "owner",
          attributes: { exclude: ["password", "createdAt", "updatedAt"] }
        }
      ]
    });
    course
      ? res.status(200).json(course)
      : res.status(404).json({
          message:
            "The course was not found. Either the course doesn't exist or there has been an error in your request."
        });
  })
);

// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post(
  "/",
  [
    check("title")
      .exists()
      .withMessage('Please Provide a value for "title"'),
    check("description")
      .exists()
      .withMessage('Please Provide a value for "description"')
  ],
  authenticateUser,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Use the Array `map()` method to get a list of error messages.
      const errorMessages = errors.array().map(error => error.msg);

      // Return the validation errors to the client.
      res.status(400).json({ errors: errorMessages });
    } else if (req.body.userId === req.currentUser.id) {
      // Get the course from the request body.
      const course = await Course.create({
        userId: req.currentUser.id,
        title: req.body.title,
        description: req.body.description,
        estimatedTime: req.body.estimatedTime,
        materialsNeeded: req.body.materialsNeeded
      });
      const uri = "/api/course/" + course.id;
      res.setHeader("Location", uri);
      res.status(201).json();
    } else {
      res.status(401).json({
        message: "You can only create or update courses that belong to you.",
        currentUser: req.currentUser.id,
        userId: req.body.userId
      });
    }
  })
);

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put(
  "/:courseId",
  [
    check("title")
      .exists()
      .withMessage('Please Provide a value for "title"'),
    check("description")
      .exists()
      .withMessage('Please Provide a value for "description"')
  ],
  authenticateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errors...
    if (!errors.isEmpty()) {
      // Use the Array `map()` method to get a list of error messages.
      const errorMessages = errors.array().map(error => error.msg);

      // Return the validation errors to the client.
      res.status(400).json({ errors: errorMessages });
    } else if (req.body.userId === req.currentUser.id) {
      let { courseId } = req.params;
      const course = await Course.findByPk(courseId, {
        attributes: { exclude: ["createdAt", "updatedAt"] }
      });
      course
        ? course
            .update({
              userId: req.body.userId,
              title: req.body.title,
              description: req.body.description,
              estimatedTime: req.body.estimatedTime,
              materialsNeeded: req.body.materialsNeeded
            })
            .then(() => {
              res.status(204).json();
            })
        : res.status(404).json({
            message:
              "The course was not found. Either the course doesn't exist or there has been an error in your request."
          });
    } else {
      res.status(403).json({
        message: "You can only create or update courses that belong to you.",
        currentUser: req.currentUser.id,
        userId: req.body.userId
      });
    }
  })
);

// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete(
  "/:courseId",
  authenticateUser,
  asyncHandler(async (req, res) => {
    let { courseId } = req.params;
    const course = await Course.findByPk(courseId, {
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
    if (course) {
      if (course.userId === req.currentUser.id) {
        course.destroy().then(() => {
          res.status(204).json();
        });
      } else {
        res.status(403).json({
          message: "You can only create or update courses that belong to you.",
          currentUser: req.currentUser.id,
          userId: req.body.userId
        });
      }
    } else {
      res
        .status(404)
        .json({ message: "The record your looking for does not exist" });
    }
  })
);

module.exports = router;
