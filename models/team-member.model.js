const { DataTypes } = require('sequelize');
const sequelize = require('../confiq/db');

module.exports = sequelize.define('TeamMember', {
  id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.TEXT, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false },
  avatarColor: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true },
  assignedChats: { type: DataTypes.INTEGER, defaultValue: 0 },
  resolvedToday: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'team_members', timestamps: true });
