This folder is reserved for database migration files.

Current approach: models are defined in `models/` and the server will run `sequelize.sync()` on startup to create tables automatically.

If you prefer managed migrations, install and configure `sequelize-cli` and place migration scripts here.
