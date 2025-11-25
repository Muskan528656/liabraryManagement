const sql = require("./db.js");

function init(schema_name, company_id = null) {

  this.schema = schema_name;
  this.companyId = company_id;
}

async function createUser(newUser) {
  const {
    firstname,
    lastname,
    email,
    password,
    userrole,
    companyid,
    managerid,
    isactive,
    whatsapp_number,
    whatsapp_settings,
    country_code,
  } = newUser;

  let finalCompanyId = companyid;

  if (!finalCompanyId && this.companyId) {
    finalCompanyId = this.companyId;
    console.log("Using companyId from Auth.init:", finalCompanyId);
  }

  if (!finalCompanyId && this.schema) {
    try {
      const companyCheck = await sql.query(`
        SELECT c.id FROM public.company c 
        WHERE LOWER(c.tenantcode) = LOWER($1) AND c.isactive = true
        LIMIT 1
      `, [this.schema]);
      if (companyCheck.rows.length > 0) {
        finalCompanyId = companyCheck.rows[0].id;
        console.log("Fetched companyId from schema:", this.schema, "Company ID:", finalCompanyId);
      } else {
        console.error("Company not found for schema:", this.schema);
      }
    } catch (error) {
      console.error("Error fetching company id from schema:", error);
    }
  }

  if (!finalCompanyId) {
    console.error("Company ID not found. Schema:", this.schema, "Provided companyid:", companyid);
    throw new Error(`Company ID is required for user creation. Schema: ${this.schema}`);
  }

  console.log("Creating user with companyId:", finalCompanyId, "in schema:", this.schema);

  // Final validation before query
  if (!this.schema || this.schema === 'undefined' || this.schema === 'null') {
    console.error("Error: Invalid schema name:", this.schema);
    throw new Error(`Invalid schema name: ${this.schema}. Cannot create user.`);
  }

  const result = await sql.query(
    `INSERT into ${this.schema}.user (firstname, lastname, email, password, userrole, companyid, managerid,isactive, whatsapp_number,whatsapp_settings, country_code) VALUES ($1, $2, $3, $4, $5, $6,$7, $8,$9, $10, $11) RETURNING id, firstname, lastname, email, password, userrole, companyid,managerid,isactive, whatsapp_number, whatsapp_settings, country_code`,
    [
      firstname,
      lastname,
      email,
      password,
      userrole,
      finalCompanyId,
      managerid,
      isactive,
      whatsapp_number,
      whatsapp_settings,
      country_code,
    ]
  );
  console.log("User created successfully. Result:", result.rows[0]);
  if (result.rowCount > 0) {
    return result.rows[0];
  }
  return null;
}

// async function checkLicenses(companyid, currentUserId) {
//   if (!this.schema) {
//     console.error("Error: Schema not initialized in checkLicenses");
//     throw new Error("Schema name is not initialized. Please call Auth.init() first.");
//   }

//   const company = await sql.query(
//     "SELECT userlicenses from company where id = $1 ",
//     [companyid]
//   );
//   let allowedUserLicenses = 0;
//   if (company.rowCount > 0) {
//     allowedUserLicenses = company.rows[0].userlicenses;
//   }
//   let result = null;
//   if (currentUserId) {
//     result = await sql.query(
//       `SELECT count(*) total from ${this.schema}.user where companyid = $1 AND isactive=true AND id != $2`,
//       [companyid, currentUserId]
//     );
//   } else {
//     result = await sql.query(
//       `SELECT count(*) total from ${this.schema}.user where companyid = $1 AND isactive=true`,
//       [companyid]
//     );
//   }

//   let existingLicenses = 0;
//   if (result.rowCount > 0) {
//     existingLicenses = result.rows[0].total;
//   }

//   if (allowedUserLicenses > existingLicenses) return true;
//   else return false;
// }


// async function findByEmail(email) {
//   const result = await sql.query(`
//   WITH user_info AS (
//     SELECT * FROM ${this.schema}.user 
//     WHERE email = $1 AND isactive = true
//   ),
//   company_info AS (
//     SELECT * FROM public.company 
//     WHERE isactive = true AND id = (SELECT companyid FROM user_info)
//   ),
//   subscription_info AS (
//     SELECT s.*, i.status AS invoice_status
//     FROM public.subscriptions s
//     LEFT JOIN public.invoices i ON i.subscription_id = s.id
//     WHERE s.company_id = (SELECT id FROM company_info)
//     LIMIT 1
//   ),
//   addon_modules AS (
//     SELECT DISTINCT m.*
//     FROM public.invoices i
//     JOIN public.invoice_items ii ON ii.invoice_id = i.id
//     JOIN public.addons a ON ii.addon_id = a.id
//     JOIN public.module m ON a.name = m.url
//     WHERE m.status = 'active' AND i.companyid = (SELECT id FROM company_info)
//   ),
//   plan_modules AS (
//     SELECT DISTINCT m.*
//     FROM public.subscriptions s
//     JOIN public.plans p ON s.plan_id = p.id
//     JOIN public.plan_module pm ON pm.planid = p.id
//     JOIN public.module m ON pm.moduleid = m.id
//     WHERE m.status = 'active' AND s.company_id = (SELECT id FROM company_info)
//   ),
//   all_modules AS (
//     SELECT * FROM plan_modules
//     UNION
//     SELECT * FROM addon_modules
//   )

//   SELECT json_build_object(
//     'id', u.id,
//     'firstname', u.firstname,
//     'lastname', u.lastname,
//     'email', u.email,
//     'whatsapp_number', u.whatsapp_number,
//     'country_code', u.country_code,
//     'password', u.password,
//     'userrole', u.userrole,
//     'companyid', u.companyid,
//     'whatsapp_settings', u.whatsapp_settings,
//     'companyname', c.name,
//     'companystreet', c.street,
//     'companycity', c.city,
//     'companypincode', c.pincode,
//     'companystate', c.state,
//     'companycountry', c.country,
//     'tenantcode', c.tenantcode,
//     'logourl', c.logourl,
//     'has_wallet', c.has_wallet,
//     'subscription', json_build_object(
//       'id', s.id,
//       'validity', s.validity,
//       'end_date', CASE 
//         WHEN s.invoice_status = 'Complete' THEN s.end_date
//         ELSE NULL
//       END
//     ),
//     'plan', json_build_object(
//       'id', p.id,
//       'name', p.name,
//       'msg_limits', p.msg_limits,
//       'number_of_whatsapp_setting', COALESCE(p.number_of_whatsapp_setting, 0),
//       'number_of_users', COALESCE(p.number_of_users, 0)
//     ),
//     'addons', (
//       SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
//         'name', a2.name,
//         'quantity', ii2.quantity
//       )) FILTER (WHERE ii2.addon_id IS NOT NULL), '[]')
//       FROM public.invoices i2
//       JOIN public.invoice_items ii2 ON ii2.invoice_id = i2.id
//       JOIN public.addons a2 ON ii2.addon_id = a2.id
//       WHERE i2.companyid = c.id
//     ),
//     'modules', (
//       SELECT COALESCE(json_agg(
//         jsonb_build_object(
//           'id', m.id,
//           'name', m.name,
//           'url', m.url,
//           'icon', m.icon,
//           'order_no', m.order_no,
//           'status', m.status,
//           'parent_module', m.parent_module
//         ) ORDER BY m.order_no), '[]'
//       )
//       FROM all_modules m
//     )
//   ) AS userinfo

//   FROM user_info u
//   INNER JOIN company_info c ON u.companyid = c.id
//   LEFT JOIN subscription_info s ON s.company_id = c.id
//   LEFT JOIN public.plans p ON s.plan_id = p.id

//   LIMIT 1
//   `, [email]);

//   if (result.rows.length > 0)
//     return result.rows[0];

//   return null;
// }
// async function findByEmail(email) {
//   if (!this.schema) {
//     console.error("Error: Schema not initialized in findByEmail");
//     throw new Error("Schema name is not initialized. Please call Auth.init() first.");
//   }

//   const emailLower = email ? email.toLowerCase().trim() : "";

//   const userCheck = await sql.query(`
//     SELECT * FROM ${this.schema}.user 
//     WHERE LOWER(TRIM(email)) = $1 AND isactive = true
//     LIMIT 1
//   `, [emailLower]);

//   if (!userCheck || userCheck.rows.length === 0) {
//     console.log("User not found in schema:", this.schema, "for email:", emailLower);
//     return null;
//   }
//   const result = await sql.query(`
//   WITH user_info AS (
//     SELECT * FROM ${this.schema}.user 
//     WHERE LOWER(TRIM(email)) = $1 AND isactive = true
//   ),
//   company_info AS (
//     SELECT * FROM public.company 
//     WHERE isactive = true AND id = (SELECT companyid FROM user_info)
//   ),
//   subscription_info AS (
//     SELECT s.*, i.status AS invoice_status
//     FROM public.subscriptions s
//     LEFT JOIN public.invoices i ON i.subscription_id = s.id
//     WHERE s.company_id = (SELECT id FROM company_info)
//     ORDER BY s.start_date DESC
//     LIMIT 1
//   ),
//   plan_modules AS (
//     SELECT DISTINCT m.*
//     FROM public.subscriptions s
//     JOIN public.plans p ON s.plan_id = p.id
//     JOIN public.plan_module pm ON pm.planid = p.id
//     JOIN public.module m ON pm.moduleid = m.id
//     WHERE s.id = (SELECT id FROM subscription_info)
//       AND m.status = 'active'
//   ),
//   addon_modules AS (
//     SELECT DISTINCT m.*
//     FROM public.invoices i
//     JOIN public.invoice_items ii ON ii.invoice_id = i.id
//     JOIN public.addons a ON ii.addon_id = a.id
//     JOIN public.module m ON a.name = m.url
//     WHERE i.subscription_id = (SELECT id FROM subscription_info)
//       AND ii.type = 'addon'
//       AND m.status = 'active'
//   ),
//   all_modules AS (
//     SELECT * FROM plan_modules
//     UNION
//     SELECT * FROM addon_modules
//   )

//   SELECT json_build_object(
//     'id', u.id,
//     'firstname', u.firstname,
//     'lastname', u.lastname,
//     'email', u.email,
//     'whatsapp_number', u.whatsapp_number,
//     'country_code', u.country_code,
//     'password', u.password,
//     'userrole', u.userrole,
//     'companyid', u.companyid,
//     'whatsapp_settings', u.whatsapp_settings,
//     'companyname', c.name,
//     'companystreet', c.street,
//     'companycity', c.city,
//     'companypincode', c.pincode,
//     'companystate', c.state,
//     'companycountry', c.country,
//     'tenantcode', c.tenantcode,
//     'logourl', c.logourl,
//     'has_wallet', c.has_wallet,
//     'subscription', json_build_object(
//       'id', s.id,
//       'validity', s.validity,
//       'end_date', CASE 
//         WHEN s.invoice_status = 'Complete' THEN s.end_date
//         ELSE NULL
//       END
//     ),
//     'plan', json_build_object(
//       'id', p.id,
//       'name', p.name,
//       'msg_limits', p.msg_limits,
//       'number_of_whatsapp_setting', COALESCE(p.number_of_whatsapp_setting, 0),
//       'number_of_users', COALESCE(p.number_of_users, 0)
//     ),
//     'addons', (
//       SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
//         'name', a2.name,
//         'quantity', ii2.quantity
//       )) FILTER (WHERE ii2.addon_id IS NOT NULL), '[]')
//       FROM public.invoices i2
//       JOIN public.invoice_items ii2 ON ii2.invoice_id = i2.id
//       JOIN public.addons a2 ON ii2.addon_id = a2.id
//       WHERE i2.subscription_id = s.id
//         AND ii2.type = 'addon'
//     ),
//     'modules', (
//       SELECT COALESCE(json_agg(
//         jsonb_build_object(
//           'id', m.id,
//           'name', m.name,
//           'url', m.url,
//           'icon', m.icon,
//           'order_no', m.order_no,
//           'status', m.status,
//           'parent_module', m.parent_module
//         ) ORDER BY m.order_no), '[]'
//       )
//       FROM all_modules m
//     )
//   ) AS userinfo

//   FROM user_info u
//   INNER JOIN company_info c ON u.companyid = c.id
//   LEFT JOIN subscription_info s ON s.company_id = c.id
//   LEFT JOIN public.plans p ON s.plan_id = p.id
//   LIMIT 1
//   `, [emailLower]);

//   console.log("result@@@", result);

//   return result.rows.length > 0 ? result.rows[0] : null;
// }

async function findByEmail(email) {
  if (!this.schema) {
    throw new Error("Schema name is not initialized. Please call Auth.init() first.");
  }

  const emailLower = email ? email.toLowerCase().trim() : "";

  // STEP 1 — Check if active user exists
  const userCheck = await sql.query(
    `
    SELECT * 
    FROM ${this.schema}."user"
    WHERE LOWER(TRIM(email)) = $1 AND isactive = true
    LIMIT 1
    `,
    [emailLower]
  );

  if (!userCheck.rows.length) {
    console.log(`User not found in ${this.schema} for email: ${emailLower}`);
    return null;
  }

  // STEP 2 — Fetch user + company details
  const result = await sql.query(
    `
    WITH user_info AS (
      SELECT *
      FROM ${this.schema}."user"
      WHERE LOWER(TRIM(email)) = $1 AND isactive = true
      LIMIT 1
    ),
    company_info AS (
      SELECT *
      FROM public.company
      WHERE id = (SELECT companyid FROM user_info)
        AND isactive = true
      LIMIT 1
    )

    SELECT json_build_object(
      'id', u.id,
      'firstname', u.firstname,
      'lastname', u.lastname,
      'email', u.email,
      'phone', u.phone,
      'country_code', u.country_code,
      'password', u.password,
      'userrole', u.userrole,
      'companyid', u.companyid,
      'time_zone', u.time_zone,

      -- company info
      'companyname', c.name,
      'companystreet', c.street,
      'companycity', c.city,
      'companypincode', c.pincode,
      'companystate', c.state,
      'companycountry', c.country,
      'tenantcode', c.tenantcode,
      'logourl', c.logourl,
      'has_wallet', c.has_wallet
    ) AS userinfo

    FROM user_info u
    LEFT JOIN company_info c ON c.id = u.companyid
    LIMIT 1
    `,
    [emailLower]
  );

  return result.rows.length ? result.rows[0] : null;
}

async function findById(id) {

  try {
    if (!this.schema) {
      throw new Error("Schema not initialized. Call init() first.");
    }

    const query = `
      SELECT 
        u.id,
        u.email,
        CONCAT(u.firstname, ' ', u.lastname) AS contactname,
        u.firstname,
        u.lastname,
        u.userrole,
        u.isactive,
        u.phone,
        u.country_code,
        u.time_zone,
        u.createddate,
        u."lastmodifieddate ",
        u."createdbyid ",
        u.lastmodifiedbyid
      FROM ${this.schema}."user" u
      WHERE u.id = $1
      LIMIT 1
    `;

    const result = await sql.query(query, [id]);

    if (result.rows.length > 0) return result.rows[0];

  } catch (error) {
    console.log("Error in findById:", error);
  }

  return null;
}

async function updateRecById(id, userRec, userid) {
  try {
    delete userRec.id;
    const query = await buildUpdateQuery(id, userRec, this.schema);
    var colValues = Object.keys(userRec).map(function (key) {
      return userRec[key];
    });
    const result = await sql.query(query, colValues);
    if (result.rowCount > 0) {
      return { id: id, ...userRec };
    }
  } catch (error) {
    return { isError: true, errors: error };
  }
  return null;
}

async function updateById(id, userRec) {
  try {
    const result = await sql.query(
      `UPDATE ${this.schema}.user SET password = $1 WHERE id = $2`,
      [userRec.password, id]
    );
    if (result.rowCount > 0) return "Updated successfully";
  } catch (error) {
    console.log("error ", error);
  }

  return null;
}

async function findAll(userinfo) {
  try {
    let query =
      "SELECT u.id, concat(u.firstname, ' ' ,u.lastname) username, concat(mu.firstname,' ', mu.lastname) managername, u.managerid, u.firstname, u.lastname, u.email, u.userrole, u.isactive, u.whatsapp_number, u.whatsapp_settings, u.country_code, c.tenantcode, c.name";

    let result = [];

    if (userinfo.userrole === "ADMIN") {
      let query1 =
        query +
        ` AS companyname FROM ${this.schema}.user u LEFT JOIN ${this.schema}.user mu ON mu.id = u.managerid LEFT JOIN public.company c ON c.id = u.companyid ORDER BY username`;
      const result1 = await sql.query(query1);
      result = result.concat(result1.rows);

      let schemaQuery = `select s.nspname as schema_name
        from pg_catalog.pg_namespace s
        join pg_catalog.pg_user u on u.usesysid = s.nspowner
        where nspname not in ('information_schema', 'pg_catalog', 'public', 'ibs_ibirds')
              and nspname not like 'pg_toast%'
              and nspname not like 'pg_temp_%'
        order by schema_name`;
      const schemaResult = await sql.query(schemaQuery);
      if (schemaResult.rows.length > 0) {
        const promises = schemaResult?.rows?.map(async (item) => {
          let query2 =
            query +
            ` AS companyname FROM ${item.schema_name}.user u LEFT JOIN ${item.schema_name}.user mu ON mu.id = u.managerid LEFT JOIN public.company c ON c.id = u.companyid ORDER BY username`;
          const result2 = await sql.query(query2);
          return result2.rows;
        });

        const query2Results = await Promise.all(promises);
        result = result.concat(...query2Results);
      }
      if (result.length > 0) return result;
    } else {
      query += ` AS companyname FROM ${this.schema}.user u LEFT JOIN ${this.schema}.user mu ON mu.id = u.managerid LEFT JOIN public.company c ON c.id = u.companyid WHERE u.companyid = $1 AND (u.id = $2 OR u.managerid = $2 )`;
      const result = await sql.query(query, [userinfo.companyid, userinfo.id]);

      if (result.rows.length > 0) return result.rows;
    }
  } catch (error) {
    console.log("error ", error);
  }

  return null;
}

async function buildUpdateQuery(id, cols, schema_name) {
  var query = [`UPDATE ${schema_name}.user `];
  query.push("SET");

  var set = [];
  Object.keys(cols).forEach(function (key, i) {
    set.push(key + " = ($" + (i + 1) + ")");
  });
  query.push(set.join(", "));

  query.push("WHERE id = '" + id + "'");

  return query.join(" ");
}

async function getAllManager(role) {
  try {
    var query = `SELECT id, isactive, concat(firstname, ' ' ,lastname) username, userrole FROM ${this.schema}.user WHERE `;
    query += " userrole = 'ADMIN' OR  userrole = 'ADMIN' ";

    result = await sql.query(query);
    return result.rows;
  } catch (errMsg) {
    console.log("errMsg===>", errMsg);
  }
}

async function checkForDuplicate(email, whatsappNumber, userId = null) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in checkForDuplicate");
    throw new Error("Schema name is not initialized. Please call Auth.init() first.");
  }

  const params = [email, whatsappNumber];
  let query = `
      SELECT id, email, whatsapp_number
      FROM ${this.schema}.user
      WHERE email = $1
      ${userId ? `AND id != $3` : ""}
      UNION ALL
      SELECT id, email, whatsapp_number
      FROM ${this.schema}.user
      WHERE whatsapp_number = $2
      ${userId ? `AND id != $3` : ""}
     
  `;

  if (userId) {
    params.push(userId);
  }

  try {
    const result = await sql.query(query, params);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    throw error;
  }

  return null;
}

async function checkCompanybyTcode(tcode) {
  let query = `SELECT * FROM public.company WHERE LOWER(tenantcode) =  LOWER($1)`;

  try {
    const result = await sql.query(query, [tcode]);
    console.log("result", result);
    if (result.rows.length > 0) {
      return result.rows;
    }
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }

  return null;
}

async function getUserCount(companyId) {
  if (!this.schema) {
    console.error("Error: Schema not initialized in getUserCount");
    throw new Error("Schema name is not initialized. Please call Auth.init() first.");
  }

  try {
    const query = `SELECT COUNT(*) FROM ${this.schema}.user WHERE companyid = $1 AND userrole = $2`;
    const result = await sql.query(query, [companyId, "USER"]);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error fetching user count:", error);
    throw new Error("Failed to fetch user count");
  }
}

module.exports = {
  createUser,
  updateRecById,
  findByEmail,
  findById,
  findAll,
  updateById,
  getAllManager,
  checkForDuplicate,
  checkCompanybyTcode,
  getUserCount,
  init,
};
