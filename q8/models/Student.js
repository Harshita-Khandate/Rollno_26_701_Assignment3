const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rollNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  marks: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  tableName: 'students',
  timestamps: true
});

module.exports = Student;
