const Sequelize = require("sequelize");

module.exports = sequelize => {
  class Course extends Sequelize.Model {}
  Course.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: 'Please provide a "User"'
          },
          notNull: {
            args: true,
            msg: '"User" is Required!'
          }
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: 'Please Provide a "Title"'
          },
          notNull: {
            args: true,
            msg: '"Title" is Required!'
          }
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: 'Please provide a "Description"'
          },
          notNull: {
            args: true,
            msg: '"Description" is Required!'
          }
        }
      },
      estimatedTime: {
        type: Sequelize.STRING,
        allowNull: true
      },
      materialsNeeded: {
        type: Sequelize.STRING,
        allowNull: true
      }
    },
    { sequelize }
  );

  Course.associate = models => {
    Course.belongsTo(models.User, {
      as: "owner",
      foreignKey: {
        fieldName: "userId",
        allowNull: false
      }
    });
  };

  return Course;
};
