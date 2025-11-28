/**
 * Auto number utility to generate sequential codes based on auto_config table.
 * Author: Muskan Khan
 * Date: NOV, 2025
 * Copyright: www.ibirdsservices.com
 */

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

module.exports = {
    getNextAutoNumber
};

