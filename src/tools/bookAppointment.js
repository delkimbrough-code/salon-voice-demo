const { zonedTimeToUtc } = require('date-fns-tz');
const { getCalendarClient } = require('../google/calendar');
const { services, salonName } = require('../config/salon.config');

function parseTime(str) {
  if (!str) return null;
  if (str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str)) return new Date(str);
  return zonedTimeToUtc(new Date(str), 'America/New_York');
}

function getServiceDuration(serviceName) {
  const service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  return service ? service.duration : 30;
}

async function bookAppointment({ callerName, callbackNumber, service, stylistName, stylistCalendarId, startTime, endTime, appointmentTime }) {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  let start, end;
  if (appointmentTime) {
    start = parseTime(appointmentTime);
    end = new Date(start.getTime() + getServiceDuration(service) * 60 * 1000);
  } else {
    start = parseTime(startTime);
    end = endTime
      ? parseTime(endTime)
      : new Date(start.getTime() + getServiceDuration(service) * 60 * 1000);
  }


  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `${service} — ${callerName}${stylistName ? ` (${stylistName})` : ''}`,
      description: `Phone: ${callbackNumber}\nBooked via ${salonName} voice assistant`,
      start: { dateTime: start.toISOString(), timeZone: 'America/New_York' },
      end: { dateTime: end.toISOString(), timeZone: 'America/New_York' },
    },
  });

  return {
    eventId: data.id,
    summary: data.summary,
    start: data.start.dateTime,
  };
}

module.exports = { bookAppointment };