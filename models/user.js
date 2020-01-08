"use strict";

const Sequelize = require("sequelize");

module.exports = sequelize => {
  class User extends Sequelize.Model {}
  User.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: '"First Name" is Required!'
          },
          notNull: {
            args: true,
            msg: '"First Name" is Required!'
          }
        }
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: '"Last Name" is Required!'
          },
          notNull: {
            args: true,
            msg: '"Last Name" is Required!'
          }
        }
      },
      emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        isUnique: true,
        validate: {
          isEmail: {
            msg: 'Must be a Valid "Email Address"'
          },
          notEmpty: {
            args: true,
            msg: '"Email Address" is Required!'
          },
          notNull: {
            args: true,
            msg: '"Email Address" is Required!'
          }
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: '"Password" is Required!'
          },
          notNull: {
            args: true,
            msg: '"Password" is Required!'
          }
        }
      }
    },
    {
      sequelize
    }
  );

  User.associate = models => {
    User.hasMany(models.Course, {
      as: "owner", // alias
      foreignKey: {
        fieldName: "userId",
        allowNull: false
      }
    });
  };

  return User;
};
