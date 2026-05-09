const { google } = require('googleapis');
const { getAuthorizedClient } = require('./auth');

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuthorizedClient() });
}

module.exports = { getCalendarClient };
