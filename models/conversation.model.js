const { DataTypes } = require('sequelize');
const sequelize = require('../confiq/db');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  contactName: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  avatarColor: { type: DataTypes.STRING, allowNull: true },
  preview: { type: DataTypes.TEXT, allowNull: true },
  time: { type: DataTypes.STRING, allowNull: true },
  unread: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, allowNull: true },
  assignee: { type: DataTypes.STRING, allowNull: true },
  channel: { type: DataTypes.STRING, allowNull: true },
  pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  tags: { type: DataTypes.TEXT, allowNull: true, get() {
    const raw = this.getDataValue('tags');
    return raw ? JSON.parse(raw) : [];
  }, set(val) {
    this.setDataValue('tags', JSON.stringify(val || []));
  } }
}, {
  tableName: 'conversations',
  timestamps: true,
});

module.exports = Conversation;
