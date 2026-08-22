const { DataTypes } = require('sequelize');
const sequelize = require('../confiq/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  conversationId: { type: DataTypes.STRING, allowNull: false },
  direction: { type: DataTypes.ENUM('in','out'), allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: true },
  attachment: { type: DataTypes.TEXT, allowNull: true },
  time: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'messages',
  timestamps: true,
});

module.exports = Message;
