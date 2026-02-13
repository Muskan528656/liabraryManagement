require("dotenv").config();
const { Pool } = require("pg");
const dbConfig = require("../config/db.config.js");


const connection = new Pool({
  user: dbConfig.USER,
  host: dbConfig.HOST,
  database: dbConfig.DB,
  password: dbConfig.PASSWORD,
  port: dbConfig.PORT,
});


module.exports = connection;
