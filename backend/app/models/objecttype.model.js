/**
 * @author      Aabid
 * @date        Dec, 2025
 * @copyright   www.ibirdsservices.com
 */

const sql = require("./db.js");


let schema = "";
function init(schema_name) {
  this.schema = schema_name;
}

async function getAllRecords() {
  let query = `SELECT * FROM demo.object_type ORDER BY label`;

  let result = await sql.query(query);

  return result.rows.length > 0 ? result.rows : null;
}

async function createRecord(reqBody) {
  const result = await sql.query(
    `INSERT INTO demo.object_type (name, status) VALUES ($1, $2) RETURNING *`,
    [reqBody.name, reqBody.status || 'active']
  );
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
}

async function updateById(id, reqBody) {
  const query = buildUpdateQuery(id, reqBody);
  var colValues = Object.keys(reqBody).map(function (key) {
    return reqBody[key];
  });
  const result = await sql.query(query, colValues);
  if (result.rowCount > 0) {
    return { id: id, ...reqBody };
  }
  return null;
}

function buildUpdateQuery(id, cols) {
  var query = [`UPDATE demo.object_type`];
  query.push("SET");
  var set = [];
  Object.keys(cols).forEach(function (key, i) {
    set.push(key + " = ($" + (i + 1) + ")");
  });
  query.push(set.join(", "));
  query.push("WHERE id = '" + id + "'");
  return query.join(" ");
}

async function deleteRecord(id) {
  try {
    const result = await sql.query(
      `DELETE FROM demo.object_type WHERE id = $1`,
      [id]
    );
    if (result.rowCount > 0) {
      return "Success";
    }
    return null;
  } catch (error) {
    console.error("Error during delete operation:", error);
    throw new Error("Failed to delete records");
  }
}

async function checkDuplicateRecord(name, id = null) {
  let query = `SELECT * FROM demo.object_type WHERE name = $1`;
  const params = [name];

  if (id) {
    query += " AND id != $2";
    params.push(id);
  }

  const result = await sql.query(query, params);
  return result.rows.length > 0;
}

module.exports = {
  getAllRecords,
  createRecord,
  updateById,
  deleteRecord,
  checkDuplicateRecord,
  init,
};
