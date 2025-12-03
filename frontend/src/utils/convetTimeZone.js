export function convertToUserTimezone(dateTimeWithTZ, userTZString) {

  const dateTime = dateTimeWithTZ.split("(")[0].trim();
  const sourceOffsetStr = dateTimeWithTZ.match(/\(GMT([+-]\d{2}):(\d{2})\)/);

  if (!sourceOffsetStr) {
    throw new Error("Invalid source timezone format.");
  }

  const sourceHoursOffset = parseInt(sourceOffsetStr[1], 10); 
  const sourceMinutesOffset = parseInt(sourceOffsetStr[2], 10); 

  const sourceOffset = sourceHoursOffset + sourceMinutesOffset / 60;


  const userOffsetMatch = userTZString.match(/GMT([+-]\d{2}):(\d{2})/);

  if (!userOffsetMatch) {
    throw new Error("Invalid user timezone format.");
  }

  const userHoursOffset = parseInt(userOffsetMatch[1], 10); 
  const userMinutesOffset = parseInt(userOffsetMatch[2], 10); 

  const userOffset = userHoursOffset + userMinutesOffset / 60;

  const [datePart, timePart] = dateTime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);


  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour - sourceOffset, minute)
  );


  const finalDate = new Date(utcDate.getTime() + userOffset * 60 * 60 * 1000);


  const formatted = finalDate.toISOString().replace("T", " ").slice(0, 16);

  return formatted;
}
