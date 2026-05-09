require('dotenv').config();
const { google } = require('googleapis');

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

function getAuthorizedClient() {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

module.exports = { getOAuthClient, getAuthorizedClient, REDIRECT_URI };
