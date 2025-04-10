const { Pool } = require('pg')
const dotenv = require('dotenv')

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For Railway/Render (optional)
  },
})

module.exports = {
  query: (text, params) => pool.query(text, params),
}
