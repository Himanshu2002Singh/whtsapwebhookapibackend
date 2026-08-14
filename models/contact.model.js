const { DataTypes } = require('sequelize');
const sequelize = require('../confiq/db');

const Contact = sequelize.define('Contact', {
  phone: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: true },
  avatarColor: { type: DataTypes.STRING, allowNull: true },
  tags: { type: DataTypes.TEXT, allowNull: true, get() {
    const raw = this.getDataValue('tags');
    return raw ? JSON.parse(raw) : [];
  }, set(val) {
    this.setDataValue('tags', JSON.stringify(val || []));
  } },
  optIn: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastSeen: { type: DataTypes.STRING, allowNull: true },
  owner: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'contacts',
  timestamps: true,
});

module.exports = Contact;
