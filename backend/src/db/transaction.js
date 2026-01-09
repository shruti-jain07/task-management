// Helper for running MySQL queries in a transaction
const pool = require('./pool'); // existing pool.js
/**
 * Runs multiple queries inside a transaction.
 * @param {function(connection)} callback - async function containing your queries
 * @returns {Promise<any>} result of callback
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection(); // get a connection from pool
  try {
    await connection.beginTransaction();         // start transaction

    const result = await callback(connection);   // run queries

    await connection.commit();                   // commit if all succeed
    return result;
  } catch (error) {
    await connection.rollback();                 // rollback on error
    throw error;
  } finally {
    connection.release();                        // release connection back to pool
  }
}
module.exports = { withTransaction };
