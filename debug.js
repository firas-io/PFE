console.log('Testing all models...\n');

const models = [
  'User',
  'Habit',
  'HabitLog',
  'HabitStats',
  'Reminder',
  'Session',
  'Onboarding'
];

models.forEach(name => {
  try {
    delete require.cache[require.resolve(`./models/${name}`)];
    const mod = require(`./models/${name}`);
    console.log(`✓ ${name}: ${typeof mod} - ${mod.name || 'N/A'}`);
  } catch(e) {
    console.log(`✗ ${name}: Error - ${e.message}`);
  }
});

console.log('\n\nTesting all routes...\n');

const routes = [
  'UserRoutes',
  'HabitLogRoutes',
  'HabitStats',
  'ReminderRoutes',
  'SessionRoutes',
  'onboardingRoutes'
];

routes.forEach(name => {
  try {
    delete require.cache[require.resolve(`./routes/${name}`)];
    const route = require(`./routes/${name}`);
    console.log(`✓ ${name}: ${typeof route} ${typeof route === 'function' ? '✓' : '✗'}`);
  } catch(e) {
    console.log(`✗ ${name}: Error - ${e.message}`);
  }
});
