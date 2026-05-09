const { utcToZonedTime, zonedTimeToUtc, format } = require('date-fns-tz');
const { addDays, addMinutes, startOfDay, isBefore } = require('date-fns');
const { getCalendarClient } = require('../google/calendar');
const { stylists, services, timezone } = require('../config/salon.config');

const TZ = timezone || 'America/New_York';
const BUSINESS_START = 9;
const BUSINESS_END = 18;
const DAYS_AHEAD = 30;
const MAX_SLOTS = 5;

function getServiceDuration(serviceName) {
  const service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  return service ? service.duration : 30;
}

function getStylistsForService(serviceName, stylistPreference) {
  if (stylistPreference) {
    const match = stylists.find(s => s.name.toLowerCase() === stylistPreference.toLowerCase());
    return match ? [match] : stylists;
  }
  const qualified = stylists.filter(s =>
    s.specialties.some(sp => sp.toLowerCase() === serviceName.toLowerCase())
  );
  return qualified.length > 0 ? qualified : stylists;
}

async function checkSlots({ service, stylistPreference }) {
  const slotMinutes = getServiceDuration(service);
  const now = new Date();
  const rangeEnd = addDays(now, DAYS_AHEAD);
  const calendar = getCalendarClient();
  const relevantStylists = getStylistsForService(service, stylistPreference);
  const calendarIds = relevantStylists.map(s => s.calendarId);

  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: rangeEnd.toISOString(),
      timeZone: TZ,
      items: calendarIds.map(id => ({ id })),
    },
  });

  const slots = [];
  let cursor = advanceToNextSlotBoundary(now, slotMinutes);

  while (slots.length < MAX_SLOTS && isBefore(cursor, rangeEnd)) {
    const local = utcToZonedTime(cursor, TZ);
    const hour = local.getHours();
    const dow = local.getDay();

    if (dow === 0) {
      cursor = nextBusinessDayStart(cursor);
      continue;
    }
    if (hour < BUSINESS_START) {
      cursor = todayBusinessStart(cursor);
      continue;
    }
    if (hour >= BUSINESS_END) {
      cursor = nextBusinessDayStart(cursor);
      continue;
    }

    const slotEnd = addMinutes(cursor, slotMinutes);
    const slotEndLocal = utcToZonedTime(slotEnd, TZ);

    if (slotEndLocal.getHours() > BUSINESS_END ||
        (slotEndLocal.getHours() === BUSINESS_END && slotEndLocal.getMinutes() > 0)) {
      cursor = nextBusinessDayStart(cursor);
      continue;
    }

    for (const stylist of relevantStylists) {
      const busyTimes = (freeBusyRes.data.calendars[stylist.calendarId]?.busy || []).map(b => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }));

      const hasConflict = busyTimes.some(b =>
        isBefore(cursor, b.end) && isBefore(b.start, slotEnd)
      );

      if (!hasConflict) {
        slots.push({
          index: slots.length + 1,
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
          label: format(cursor, "EEEE, MMMM do 'at' h:mm a zzz", { timeZone: TZ }),
          durationMinutes: slotMinutes,
          stylistName: stylist.name,
          stylistCalendarId: stylist.calendarId,
        });
        break;
      }
    }

    cursor = addMinutes(cursor, slotMinutes);
  }

  return slots;
}

function advanceToNextSlotBoundary(date, slotMinutes) {
  const slotMs = slotMinutes * 60 * 1000;
  const remainder = date.getTime() % slotMs;
  if (remainder === 0) return date;
  return new Date(date.getTime() + (slotMs - remainder));
}

function todayBusinessStart(utcDate) {
  const local = utcToZonedTime(utcDate, TZ);
  const d = new Date(local);
  d.setHours(BUSINESS_START, 0, 0, 0);
  return zonedTimeToUtc(d, TZ);
}

function nextBusinessDayStart(utcDate) {
  const local = utcToZonedTime(utcDate, TZ);
  let next = new Date(startOfDay(addDays(local, 1)));
  next.setHours(BUSINESS_START, 0, 0, 0);
  while (next.getDay() === 0) {
    next = new Date(startOfDay(addDays(next, 1)));
    next.setHours(BUSINESS_START, 0, 0, 0);
  }
  return zonedTimeToUtc(next, TZ);
}

module.exports = { checkSlots };