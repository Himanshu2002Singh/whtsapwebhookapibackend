const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
        logging: false
    }
);

sequelize.authenticate()
.then(() => {
    console.log("Database Connected");
})
.catch((err) => {
    console.log(err.message);
});

module.exports = sequelize;