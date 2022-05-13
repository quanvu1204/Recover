const { Pool } = require("pg");

const db = new Pool({
  connectionString: "postgres://postgres:postgres@127.0.0.1:5433/uploads",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

db.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
});

module.exports = {
  dbConnect: () => {
    return db;
  },
};
