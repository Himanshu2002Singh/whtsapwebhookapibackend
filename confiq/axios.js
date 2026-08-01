const axios = require("axios");

module.exports = axios.create({
    baseURL: "https://graph.facebook.com/v23.0",
    headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json"
    }
});