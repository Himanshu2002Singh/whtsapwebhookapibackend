require("dotenv").config();

const app = require("./app");

const { sequelize } = require('./models');
const messageService = require('./services/message.service');

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await sequelize.sync();
        console.log('Database synced');

        // load persisted messages/contacts/conversations into memory
        await messageService.loadFromDB();

        app.listen(PORT, () => {
            console.log(`Server Running On ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server', err.message || err);
        process.exit(1);
    }
}

start();