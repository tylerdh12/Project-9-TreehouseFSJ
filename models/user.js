"use strict";

const Sequelize = require("sequelize");

module.exports = sequelize => {
  class User extends Sequelize.Model {}
  User.init(
    {
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "First Name is Required!"
          }
        }
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Last Name is Required!"
          }
        }
      },
      emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Email Address is Required!"
          }
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password is Required!"
          }
        }
      }
    },
    { sequelize }
  );

  return User;
};
