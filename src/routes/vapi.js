const { Router } = require('express');
const { checkSlots } = require('../tools/checkSlots');
const { bookAppointment } = require('../tools/bookAppointment');
const { getServiceNames } = require('../config/services');
const { salonName: SALON_NAME } = require('../config/salon.config');

const router = Router();

router.post('/vapi-webhook', async (req, res) => {
  const { message } = req.body || {};

  if (message?.type === 'assistant-request') {
    return res.json({ assistant: buildDynamicAssistant() });
  }

  if (message?.type === 'tool-calls') {
    const results = await handleToolCalls(message.toolCallList || []);
    return res.json({ results });
  }

  res.json({});
});

function buildDynamicAssistant() {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    model: {
      messages: [{ role: 'system', content: buildSystemPrompt(currentTime) }],
    },
  };
}

function buildSystemPrompt(currentTime) {
  const salonName = SALON_NAME;
  const services = getServiceNames().join(', ');

  return `You are a friendly and professional virtual receptionist for ${salonName}, a hair salon.

The current date and time in Eastern time is: ${currentTime}
Business hours are Monday through Saturday, 9:00 AM to 6:00 PM Eastern.

---

IF the current time is within business hours:
Say: "Thanks for calling ${salonName}! We're open right now — feel free to call us directly and we'll get you taken care of." Then end the call warmly.

---

IF the current time is outside business hours, proceed as follows:

## Your role
You are scheduling hair appointments on behalf of the salon. Keep the conversation friendly, upbeat, and efficient.

## Information to collect (in this order)
1. First and last name
2. Best callback phone number
3. Which service they'd like — the options are: ${services}

That's all you need. Once you have those three things, check availability.

## Scheduling flow
After collecting name, phone number, and service:
1. Use the checkSlots tool with the service name. While checking, say: "Let me pull up what we have available!"
2. Offer 2 or 3 options naturally: "I've got a few openings — would [Day at Time] or [Day at Time] work for you?"
3. Once the caller picks a time, repeat it back to confirm.
4. Use the bookAppointment tool to lock it in.
5. Close with: "Perfect, you're all set! We'll see you [day] at [time]. Thanks for calling ${salonName} — see you soon!"

## Service durations (for your awareness — handled automatically)
- Haircut or Trim: 30 minutes
- Blowout: 45 minutes
- Color: 90 minutes
- Highlights or Keratin Treatment: 2 hours

## If no slots are available
Say: "It looks like we're pretty booked up for the next 30 days! Give us a call during business hours — Monday through Saturday, 9am to 6pm Eastern — and we'll find something that works for you."

## Other rules
- If they ask about pricing, say: "For pricing, give us a call during business hours and we can walk you through everything."
- If they want a service not on the list, say: "I want to make sure we can accommodate you — call us during business hours and we'll sort out the details."
- Keep responses concise and natural. This is a voice call, not a chat.`;
}

async function handleToolCalls(toolCallList) {
  return Promise.all(
    toolCallList.map(async ({ id, function: fn }) => {
      let result;
      try {
        const args = typeof fn.arguments === 'string'
          ? JSON.parse(fn.arguments || '{}')
          : (fn.arguments || {});

        if (fn.name === 'checkSlots') {
          const slots = await checkSlots(args);
          if (slots.length === 0) {
            result = 'NO_SLOTS_AVAILABLE';
          } else {
            const labels = slots.map(s => `${s.index}. ${s.label} (${s.durationMinutes} min)`).join('\n');
            const slotData = slots.map(s => ({ index: s.index, start: s.start, end: s.end }));
            result = `Available slots for ${args.service}:\n${labels}\n\nSlot data for booking: ${JSON.stringify(slotData)}`;
          }
        } else if (fn.name === 'bookAppointment') {
          const booking = await bookAppointment(args);
          const displayTime = new Date(booking.start).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          result = `Appointment confirmed: "${booking.summary}" on ${displayTime} Eastern.`;
        } else {
          result = `Unknown tool: ${fn.name}`;
        }
      } catch (err) {
        console.error(`[tool:${fn?.name}]`, err.message);
        result = 'Something went wrong on my end. Please try again.';
      }

      return { toolCallId: id, result };
    })
  );
}

module.exports = router;
