async function withTransaction(pool, operation, { isolation } = {}) {
  if (isolation !== undefined && isolation !== 'read_committed') throw new Error('Unsupported transaction isolation option');
  const client = await pool.connect();
  let discardClient = false;
  try {
    await client.query(isolation === 'read_committed' ? 'BEGIN ISOLATION LEVEL READ COMMITTED' : 'BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      discardClient = true;
      // Preserve the operation as the primary cause and retain both failures.
      // eslint-disable-next-line preserve-caught-error
      throw new AggregateError([error, rollbackError], 'Transaction failed and rollback failed', { cause: error });
    }
    throw error;
  } finally {
    client.release(discardClient);
  }
}

module.exports = { withTransaction };
