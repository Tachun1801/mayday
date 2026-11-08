// Parse only structural declarations in the checked-in pg_dump. Never execute
// SQL from the dump or inspect/return COPY data, comments or credential values.
function parseSchema(sql) {
  const columns = [];
  for (const [, table, body] of sql.matchAll(/^CREATE TABLE public\.([a-z][a-z0-9_]*) \(\n([\s\S]*?)^\);/gm)) {
    let position = 0;
    for (const [, name, declaration] of body.matchAll(/^ {4}([a-z][a-z0-9_]*) ([^\n]+)/gm)) {
      const type = declaration.split(/ DEFAULT | GENERATED | NOT NULL/)[0].replace(/,$/, '').trim();
      columns.push({ table_name: table, column_name: name, position: ++position, type,
        not_null: /\bNOT NULL\b/.test(declaration), generated: /\bGENERATED ALWAYS AS\b/.test(declaration),
        identity: false, has_default: /\bDEFAULT\b/.test(declaration) });
    }
  }
  if (!columns.length) throw new Error('Schema baseline unavailable');
  for (const [, table, name] of sql.matchAll(/^ALTER TABLE public\.([a-z][a-z0-9_]*) ALTER COLUMN ([a-z][a-z0-9_]*) ADD GENERATED ALWAYS AS IDENTITY/gm)) {
    const column = columns.find((item) => item.table_name === table && item.column_name === name);
    if (!column) throw new Error('Unsupported identity declaration');
    column.identity = true;
  }
  return columns;
}

function compareColumns(expected, actual) {
  const fields = ['position', 'type', 'not_null', 'generated', 'identity', 'has_default'];
  const key = (column) => `${column.table_name}.${column.column_name}`;
  const remote = new Map(actual.map((column) => [key(column), column]));
  const differences = [];
  for (const column of expected) {
    const match = remote.get(key(column));
    if (!match) differences.push({ column: key(column), mismatch: ['missing'] });
    else {
      const mismatch = fields.filter((field) => column[field] !== match[field]);
      if (mismatch.length) differences.push({ column: key(column), mismatch });
      remote.delete(key(column));
    }
  }
  for (const name of remote.keys()) differences.push({ column: name, mismatch: ['unexpected'] });
  return differences;
}

module.exports = { parseSchema, compareColumns };
