/*
** @author: Aabid 
** @date: Dec-2025
*/

import { COUNTRY_TIMEZONE } from '../constants/COUNTRY_TIMEZONE.js';

function normalizeDateInput(dateInput) {
  if (!dateInput) return dateInput;
  const test = new Date(dateInput);
  if (!isNaN(test.getTime())) return dateInput;

  const match = dateInput.match(/^(\d{2})-(\d{2})-(\d{2,4})(.*)$/);

  if (match) {
    let [_, dd, mm, yy, rest] = match;

    if (yy.length === 2) {
      const numYear = Number(yy);
      yy = numYear < 50 ? `20${yy}` : `19${yy}`;
    }

    return `${yy}-${mm}-${dd}${rest}`;
  }

  return dateInput;
}

function resolveTimezone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  if (timeZone.includes('/')) return timeZone;

  const offsetMatch = timeZone.match(/^(GMT|UTC)([+-]\d{1,2}:\d{2})$/);

  if (offsetMatch) {
    const offset = offsetMatch[2]; // +05:30
    const formattedOffset = `UTC${offset}`;

    for (const country of COUNTRY_TIMEZONE) {
      const timezone = country.timezones.find(tz => tz.gmtOffset === formattedOffset);
      if (timezone) return timezone.zoneName;
    }
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}


export function convertToUserTimezone(dateInput, timeZone) {
  console.log("dateInput =", dateInput);
  console.log("timeZone =", timeZone);

  if (!dateInput) return "";

  const normalizedDate = normalizeDateInput(dateInput);
  console.log("normalizedDate =", normalizedDate);

  const date = new Date(normalizedDate);

  if (isNaN(date.getTime())) {
    console.warn("❌ Invalid Date:", dateInput);
    return dateInput;
  }

  const targetTimeZone = resolveTimezone(timeZone);
  console.log("Resolved TimeZone =", targetTimeZone);

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: targetTimeZone,
    });

    console.log("formatter ", formatter);
    console.log("formatter2333 ", formatter.format(date).replace(", ", " "));
  
    return formatter.format(date).replace(", ", " ");
  } catch (err) {
    console.error(`❌ Invalid Timezone "${targetTimeZone}". Using system timezone.`);

    return date.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(", ", " ");
  }
}
