const pg = require('pg');

const { Pool } = pg;

const pool = new Pool({
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;