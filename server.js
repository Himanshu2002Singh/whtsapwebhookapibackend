require("dotenv").config();

const app = require("./app");

const { sequelize } = require('./models');
const messageService = require('./services/message.service');
const axiosClient = require('./confiq/axios');
const teamService = require('./services/team.service');

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await sequelize.sync();
        try {
            await sequelize.query('ALTER TABLE messages ADD COLUMN attachment TEXT NULL');
        } catch (migrationError) {
            if (!/duplicate column|already exists/i.test(migrationError.message || '')) {
                console.error('Attachment column migration failed:', migrationError.message || migrationError);
            }
        }
        console.log('Database synced');

        // load persisted messages/contacts/conversations into memory
        await messageService.loadFromDB();
        await teamService.loadFromDB();

        // quick ACCESS_TOKEN check with Graph API
        try {
            const res = await axiosClient.get('/me');
            console.log('Facebook Graph API token valid for app id:', res.data?.id || '(id not provided)');
        } catch (err) {
            console.error('Facebook Graph API token validation failed. Incoming/outgoing WhatsApp API calls will fail.');
            console.error('Error response:', err.response?.data || err.message || err);
            console.error('Please verify `ACCESS_TOKEN` and `PHONE_NUMBER_ID` in .env and refresh the token if expired.');
        }

        app.listen(PORT, () => {
            console.log(`Server Running On ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server', err.message || err);
        process.exit(1);
    }
}

start();
