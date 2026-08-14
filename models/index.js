const sequelize = require('../confiq/db');
const Contact = require('./contact.model');
const Conversation = require('./conversation.model');
const Message = require('./message.model');

Conversation.belongsTo(Contact, { foreignKey: 'phone', targetKey: 'phone', as: 'contact' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', targetKey: 'id', as: 'conversation' });

module.exports = {
  sequelize,
  Contact,
  Conversation,
  Message
};
