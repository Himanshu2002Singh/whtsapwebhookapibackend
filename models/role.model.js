const { DataTypes } = require('sequelize');
const sequelize = require('../confiq/db');

module.exports = sequelize.define('Role', {
  id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING, allowNull: true },
  permissions: { type: DataTypes.TEXT, allowNull: false, get() { const raw = this.getDataValue('permissions'); return raw ? JSON.parse(raw) : {}; }, set(value) { this.setDataValue('permissions', JSON.stringify(value || {})); } },
}, { tableName: 'roles', timestamps: true });
