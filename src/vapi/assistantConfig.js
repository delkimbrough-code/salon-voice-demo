const { getServiceNames } = require('../config/services');
const { salonName: SALON_NAME } = require('../config/salon.config');

function buildAssistantConfig(backendUrl) {
  const webhookUrl = `${backendUrl}/vapi-webhook`;
  const salonName = SALON_NAME;
  const serviceEnum = getServiceNames();

  return {
    name: `${salonName} Receptionist`,
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en-US',
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a receptionist for ${salonName}. The full system prompt is provided at call time.`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'checkSlots',
            description: 'Check available appointment slots for a specific salon service (Monday–Saturday, 9am–6pm Eastern, next 30 days).',
            parameters: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  enum: serviceEnum,
                  description: 'The service the caller wants to book',
                },
              },
              required: ['service'],
            },
          },
          server: { url: webhookUrl, timeoutSeconds: 30 },
        },
        {
          type: 'function',
          function: {
            name: 'bookAppointment',
            description: 'Book a salon appointment on the calendar.',
            parameters: {
              type: 'object',
              properties: {
                callerName:        { type: 'string', description: 'Full name of the caller' },
                callbackNumber:    { type: 'string', description: 'Best callback phone number' },
                service:           { type: 'string', description: 'Service being booked (e.g., Haircut, Color)' },
                startTime:         { type: 'string', description: 'ISO 8601 start time of the chosen slot' },
                endTime:           { type: 'string', description: 'ISO 8601 end time of the chosen slot' },
                stylistName:       { type: 'string', description: 'Name of the stylist for the slot' },
                stylistCalendarId: { type: 'string', description: 'Google Calendar ID of the stylist' },
              },
              required: ['callerName', 'callbackNumber', 'service', 'startTime', 'endTime'],
            },
          },
          server: { url: webhookUrl, timeoutSeconds: 30 },
        },
      ],
    },
    voice: {
      provider: 'azure',
      voiceId: 'en-US-JennyNeural',
      // Change voice in the Vapi dashboard → Voice Library, then update here and re-run: npm run setup
    },
    server: {
      url: webhookUrl,
      timeoutSeconds: 30,
    },
    firstMessage: `Thanks for calling ${salonName}! How can I help you today?`,
    endCallMessage: `Thanks for calling ${salonName} — talk soon!`,
    endCallPhrases: ['goodbye', 'bye', 'thanks bye', 'have a good one', 'thank you goodbye'],
    backgroundSound: 'off',
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 480,
  };
}

module.exports = { buildAssistantConfig };
