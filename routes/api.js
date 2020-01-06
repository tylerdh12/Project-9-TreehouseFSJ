const express = require("express");
const router = express.Router();

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

// GET /api/users 200 - Returns the currently authenticated user
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.json(users);
  })
);

// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post(
  "/users",
  jsonParse,
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).send();
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
