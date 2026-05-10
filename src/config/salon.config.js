module.exports = {
  salonName: 'Bella Vista Salon',
  assistantName: 'Jade',
  timezone: 'America/New_York',
  businessHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '18:00' },
  },
  stylists: [
    {
      name: 'Sophia',
      calendarId: '36bf91719e5637debc599935737a7eede90cddf4c9d712e86c07a202090fa6f0@group.calendar.google.com',
      specialties: ['Full Color', 'Highlights/Balayage', "Women's Haircut", 'Root Touch-Up'],
    },
    {
      name: 'Jamie',
      calendarId: '12b36126483992c63281612caa231d76231aaede69c4a8a9158759fc70bc318e@group.calendar.google.com',
      specialties: ["Women's Haircut", "Men's Haircut", 'Blowout', 'Keratin Treatment'],
    },
    {
      name: 'Sally',
      calendarId: '79d82b16c448a8afa1ce2e0e8d46742de8a8eb694e86da7f1185d596edf357ff@group.calendar.google.com',
      specialties: ['Natural Hair Consultation', 'Braids/Locs', "Women's Haircut"],
    },
  ],
  services: [
    { name: "Women's Haircut", duration: 45 },
    { name: "Men's Haircut", duration: 30 },
    { name: 'Blowout', duration: 45 },
    { name: 'Full Color', duration: 120 },
    { name: 'Highlights/Balayage', duration: 150 },
    { name: 'Keratin Treatment', duration: 180 },
    { name: 'Natural Hair Consultation', duration: 30 },
    { name: 'Braids/Locs', duration: 180 },
    { name: 'Root Touch-Up', duration: 90 },
  ],
};