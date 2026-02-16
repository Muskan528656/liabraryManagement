

const AutoConfig = require("../models/autoconfig.model.js");

async function getNextAutoNumber(tableName, defaults = {}, userId = null) {
    if (!tableName) {
        throw new Error("tableName is required for auto number generation");
    }

    const fallbackConfig = {
        table_name: tableName,
        prefix: defaults.prefix || "",
        digit_count: Number.isInteger(defaults.digit_count) ? defaults.digit_count : 5,
        next_number: defaults.next_number ? defaults.next_number.toString() : "1"
    };

    let config = await AutoConfig.getByTableName(tableName);
    if (!config) {
        config = await AutoConfig.create(fallbackConfig, userId);
    }

    const digitCount = Number.isInteger(config.digit_count) ? config.digit_count : fallbackConfig.digit_count;
    const prefix = config.prefix ?? fallbackConfig.prefix ?? "";
    const nextNumber = (config.next_number ?? fallbackConfig.next_number ?? "1").toString();
    const formattedNumber = `${prefix}${digitCount > 0 ? nextNumber.padStart(digitCount, "0") : nextNumber}`;

    await AutoConfig.incrementCounter(tableName, userId);
    return formattedNumber;
}


async function generateAutoNumberSafe(tableName, userId, prefix = "GEN-", digitCount = 5) {
    try {
        return await getNextAutoNumber(tableName, { prefix: prefix, digit_count: digitCount }, userId);
    } catch (error) {
        console.error("Error generating auto number:", error);
        throw error;
    }
}
function applyMemberTypeFilter(baseQuery, memberType, values = []) {
    if (!memberType) {
        return { query: baseQuery, values };
    }

    const type = memberType.toLowerCase();

  
    if (type === "all" || type === "other") {
        return { query: baseQuery, values };
    }

    const condition = `LOWER(lm.library_member_type) = LOWER($${values.length + 1})`;
    values.push(memberType);

    if (baseQuery.toLowerCase().includes("where")) {
        baseQuery += ` AND ${condition}`;
    } else {
        baseQuery += ` WHERE ${condition}`;
    }

    return { query: baseQuery, values };
}

/**
 * Generate next rack number with prefix (e.g., RACK-01, RACK-02)
 * @param {string} floor - Floor name
 * @param {string} schema - Database schema
 * @returns {Promise<string>} - Next rack number
 */
async function getNextRackNumber(floor, schema) {
    const sql = require("../models/db.js");
    
    try {
        // Get the last rack number for this floor
        const query = `SELECT rack FROM ${schema}.rack_mapping WHERE floor = $1 AND rack ~ '^RACK-[0-9]+$' ORDER BY rack DESC LIMIT 1`;
        const result = await sql.query(query, [floor]);
        
        let nextNumber = 1;
        if (result.rows.length > 0) {
            const lastRack = result.rows[0].rack;
            const match = lastRack.match(/RACK-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        
        return `RACK-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error("Error generating rack number:", error);
        return `RACK-001`;
    }
}

module.exports = {
    getNextAutoNumber,
    generateAutoNumberSafe,
    applyMemberTypeFilter,
    getNextRackNumber
};
