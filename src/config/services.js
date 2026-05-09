const SERVICES = {
  'Haircut':           { duration: 30  },
  'Trim':              { duration: 30  },
  'Blowout':           { duration: 45  },
  'Color':             { duration: 90  },
  'Highlights':        { duration: 120 },
  'Keratin Treatment': { duration: 120 },
};

function getServiceDuration(serviceName) {
  const key = Object.keys(SERVICES).find(
    k => k.toLowerCase() === (serviceName || '').toLowerCase()
  );
  return key ? SERVICES[key].duration : 30;
}

function getServiceNames() {
  return Object.keys(SERVICES);
}

module.exports = { SERVICES, getServiceDuration, getServiceNames };
