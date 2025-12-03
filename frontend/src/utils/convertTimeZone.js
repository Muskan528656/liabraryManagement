/**
 * Converts a date string to a specific timezone and formats it.
 * 
 * @param {string|Date} dateInput - The date (ISO string, Date object, etc.)
 * @param {string} timeZone - IANA Timezone string (e.g., "Asia/Kolkata", "UTC")
 * @returns {string} - Formatted string "YYYY-MM-DD HH:mm"
 */
export function convertToUserTimezone(dateInput, timeZone) {
    console.log("dateInput TimeZone ", dateInput, timeZone)

    if (!dateInput) return "";


    let targetTimeZone = timeZone;

    if (!targetTimeZone || typeof targetTimeZone !== "string") {
        targetTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }


    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        console.warn("Invalid Date detected:", dateInput);
        return dateInput;
    }
    try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: targetTimeZone,
        });

        const formattedDate = formatter.format(date).replace(", ", " ");
        return formattedDate;

    } catch (error) {
        console.error(`Timezone "${targetTimeZone}" is invalid.Falling back to System Time.`);

        return date.toLocaleString("en-CA", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: false
        }).replace(", ", " ");
    }
}