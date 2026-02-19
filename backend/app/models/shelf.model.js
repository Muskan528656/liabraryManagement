const sql = require("./db.js");

let schema = "";

function init(schema_name) {
    schema = schema_name;
}

// ================= FIND ALL =================
async function findAll() {
    const q = `
        SELECT id, branch_id, name, floor, rack, shelf, classification_type, 
               classification_from, classification_to, capacity,
               full_location_code, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, is_active
        FROM ${schema}.rack_mapping
        ORDER BY floor, rack, shelf, name
    `;
    const r = await sql.query(q);
    return r.rows;
}

// ================= FIND BY ID =================
async function findById(id) {
    const q = `
        SELECT id, branch_id, name, floor, rack, shelf, classification_type, 
               classification_from, classification_to, capacity,
               full_location_code, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, is_active
        FROM ${schema}.rack_mapping
        WHERE id=$1
    `;
    const r = await sql.query(q, [id]);
    return r.rows[0];
}

// ================= CHECK FOR DUPLICATES =================
async function checkDuplicate(data, excludeId = null) {
    // Check for duplicate name + floor + rack + shelf combination
    let dupQuery = `
        SELECT id FROM ${schema}.rack_mapping
        WHERE name = $1 AND floor = $2 AND rack = $3 AND shelf = $4
    `;
    let params = [data.name, data.floor, data.rack, data.shelf];

    if (excludeId) {
        dupQuery += ` AND id <> $4`;
        params.push(excludeId);
    }

    dupQuery += ` LIMIT 1`;

    const dup = await sql.query(dupQuery, params);

    if (dup.rows.length > 0) {
        throw new Error("This name, floor and rack combination already exists");
    }

    // Check for overlapping classification ranges if classification_type is same
    if (data.classification_type && data.classification_from && data.classification_to) {
        let rangeQuery = `
            SELECT id FROM ${schema}.rack_mapping
            WHERE classification_type = $1 
            AND (
                (classification_from <= $2 AND classification_to >= $2) OR
                (classification_from <= $3 AND classification_to >= $3) OR
                (classification_from >= $2 AND classification_to <= $3)
            )
        `;
        let rangeParams = [data.classification_type, data.classification_from, data.classification_to];

        if (excludeId) {
            rangeQuery += ` AND id <> $4`;
            rangeParams.push(excludeId);
        }

        rangeQuery += ` LIMIT 1`;

        const rangeDup = await sql.query(rangeQuery, rangeParams);

        if (rangeDup.rows.length > 0) {
            throw new Error("Classification range overlaps with existing shelf");
        }
    }
}

async function create(data) {
    // Check for duplicates
    await checkDuplicate(data);

    // INSERT
    const query = `
        INSERT INTO ${schema}.rack_mapping
        (branch_id, name, floor, rack, shelf, classification_type, classification_from, classification_to, capacity, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11, $12)
        RETURNING *
    `;

    const values = [
        data.branch_id || null,
        data.name || null,
        data.floor || null,
        data.rack || null,
        data.shelf || null,
        data.classification_type || null,
        data.classification_from || null,
        data.classification_to || null,
        data.capacity || 100,
        data.createdbyid || null,
        data.lastmodifiedbyid || null,
        data.is_active !== undefined ? data.is_active : true
    ];

    try {
        const result = await sql.query(query, values);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error("This rack mapping already exists");
        }
        throw error;
    }
}
async function findGrouped() {
    const query = `
        SELECT 
            floor,
            rack,
            json_agg(
                json_build_object(
                    'id', id,
                    'name', name,
                    'floor', floor,
                    'rack', rack,
                    'shelf', shelf,
                    'classification_type', classification_type,
                    'classification_from', classification_from,
                    'classification_to', classification_to,
                    'capacity', capacity,
                    'full_location_code', full_location_code,
                    'is_active', is_active
                ) ORDER BY name
            ) as shelves
        FROM ${schema}.rack_mapping
        GROUP BY floor, rack
        ORDER BY floor, rack
    `;

    const result = await sql.query(query);
    return result.rows;
}
async function updateById(id, data) {
    // Check for duplicates (excluding current id)
    await checkDuplicate(data, id);

    // UPDATE query
    const q = `
        UPDATE ${schema}.rack_mapping
        SET branch_id = COALESCE($2, branch_id),
            name = COALESCE($3, name),
            floor = COALESCE($4, floor),
            rack = COALESCE($5, rack),
            shelf = COALESCE($6, shelf),
            classification_type = COALESCE($7, classification_type),
            classification_from = COALESCE($8, classification_from),
            classification_to = COALESCE($9, classification_to),
            capacity = COALESCE($10, capacity),
            lastmodifieddate = NOW(),
            lastmodifiedbyid = COALESCE($11, lastmodifiedbyid),
            is_active = COALESCE($12, is_active)
        WHERE id = $1
        RETURNING *
    `;

    try {
        const r = await sql.query(q, [
            id,
            data.branch_id || null,
            data.name || null,
            data.floor || null,
            data.rack || null,
            data.shelf || null,
            data.classification_type || null,
            data.classification_from || null,
            data.classification_to || null,
            data.capacity || null,
            data.lastmodifiedbyid || null,
            data.is_active
        ]);

        if (r.rows.length === 0) {
            throw new Error("Shelf not found");
        }

        return r.rows[0];
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error("This rack mapping already exists");
        }
        throw error;
    }
}

// ================= GET SUGGESTIONS =================
async function getSuggestions(field, searchTerm, filters = {}) {
    let q;
    let params = [];

    if (field === 'name') {
        // If floor, rack and shelf are provided, get names for that combination
        if (filters.floor && filters.rack && filters.shelf) {
            q = `
                SELECT DISTINCT name 
                FROM ${schema}.rack_mapping
                WHERE floor = $1 AND rack = $2 AND shelf = $3
                AND name ILIKE $4
                ORDER BY name
                LIMIT 20
            `;
            params = [filters.floor, filters.rack, filters.shelf, `%${searchTerm}%`];
        } else if (filters.floor && filters.rack) {
            q = `
                SELECT DISTINCT name 
                FROM ${schema}.rack_mapping
                WHERE floor = $1 AND rack = $2
                AND name ILIKE $3
                ORDER BY name
                LIMIT 20
            `;
            params = [filters.floor, filters.rack, `%${searchTerm}%`];
        } else {
            q = `
                SELECT DISTINCT name 
                FROM ${schema}.rack_mapping
                WHERE name ILIKE $1
                ORDER BY name
                LIMIT 20
            `;
            params = [`%${searchTerm}%`];
        }
    } else if (field === 'floor') {
        q = `
            SELECT DISTINCT floor 
            FROM ${schema}.rack_mapping
            WHERE floor ILIKE $1
            ORDER BY floor
            LIMIT 20
        `;
        params = [`%${searchTerm}%`];
    } else if (field === 'rack') {
        // If floor is provided, get racks for that floor
        if (filters.floor) {
            q = `
                SELECT DISTINCT rack 
                FROM ${schema}.rack_mapping
                WHERE floor = $1 AND rack ILIKE $2
                ORDER BY rack
                LIMIT 20
            `;
            params = [filters.floor, `%${searchTerm}%`];
        } else {
            q = `
                SELECT DISTINCT rack 
                FROM ${schema}.rack_mapping
                WHERE rack ILIKE $1
                ORDER BY rack
                LIMIT 20
            `;
            params = [`%${searchTerm}%`];
        }
    } else if (field === 'shelf') {
        // If floor and rack are provided, get shelves for that floor and rack
        if (filters.floor && filters.rack) {
            q = `
                SELECT DISTINCT shelf 
                FROM ${schema}.rack_mapping
                WHERE floor = $1 AND rack = $2 AND shelf ILIKE $3
                ORDER BY shelf
                LIMIT 20
            `;
            params = [filters.floor, filters.rack, `%${searchTerm}%`];
        } else {
            q = `
                SELECT DISTINCT shelf 
                FROM ${schema}.rack_mapping
                WHERE shelf ILIKE $1
                ORDER BY shelf
                LIMIT 20
            `;
            params = [`%${searchTerm}%`];
        }
    } else {
        return [];
    }

    const r = await sql.query(q, params);
    return r.rows.map(row => row[field]);
}

// ================= GET LAST BY FLOOR-RACK-NAME =================
async function getLastByFloorRackName(floor, rack, name) {
    const q = `
        SELECT * FROM ${schema}.rack_mapping
        WHERE floor = $1 AND rack = $2 AND name = $3
        ORDER BY classification_to DESC
        LIMIT 1
    `;
    const r = await sql.query(q, [floor, rack, name]);
    return r.rows[0] || null;
}

// ================= GET BY BRANCH =================
async function getByBranch(branchId) {
    const q = `
        SELECT id, branch_id, name, floor, rack, shelf, classification_type, 
               classification_from, classification_to, capacity,
               full_location_code, createddate, lastmodifieddate, createdbyid, lastmodifiedbyid, is_active
        FROM ${schema}.rack_mapping
        WHERE branch_id = $1
        ORDER BY floor, rack, shelf, name
    `;
    const r = await sql.query(q, [branchId]);
    return r.rows;
}

// ================= GET RACK USAGE (live count from book_copy) =================
async function getRackUsage(rackId) {
    const q = `
        SELECT 
            rm.id,
            rm.name,
            rm.capacity,
            rm.full_location_code,
            COUNT(bc.id) as used_count,
            rm.capacity - COUNT(bc.id) as available_slots
        FROM ${schema}.rack_mapping rm
        LEFT JOIN ${schema}.book_copy bc ON bc.rack_mapping_id = rm.id
        WHERE rm.id = $1
        GROUP BY rm.id, rm.name, rm.capacity, rm.full_location_code
    `;
    const r = await sql.query(q, [rackId]);
    return r.rows[0] || null;
}

// ================= GET ALL RACKS WITH USAGE =================
async function findAllWithUsage(branchId) {
    const q = `
        SELECT 
            rm.*,
            COUNT(bc.id) as used_count,
            rm.capacity - COUNT(bc.id) as available_slots,
            ROUND((COUNT(bc.id)::NUMERIC / NULLIF(rm.capacity, 0)) * 100, 1) as usage_percentage
        FROM ${schema}.rack_mapping rm
        LEFT JOIN ${schema}.book_copy bc ON bc.rack_mapping_id = rm.id
        ${branchId ? 'WHERE rm.branch_id = $1' : ''}
        GROUP BY rm.id
        ORDER BY rm.floor, rm.rack, rm.shelf, rm.name
    `;
    const r = await sql.query(q, branchId ? [branchId] : []);
    return r.rows;
}

// ================= DELETE =================
async function deleteById(id) {
    await sql.query(
        `DELETE FROM ${schema}.rack_mapping WHERE id=$1`,
        [id]
    );
}

module.exports = {
    init,
    findAll,
    findById,
    create,
    updateById,
    deleteById,
    getSuggestions,
    getLastByFloorRackName,
    checkDuplicate,
    findGrouped,
    getByBranch,
    getRackUsage,
    findAllWithUsage
};