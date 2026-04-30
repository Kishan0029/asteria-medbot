const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dashboard_api_workflows.json', 'utf8'));
const agent = data.nodes.find(n => n.name === 'AI Agent');

let msg = agent.parameters.options.systemMessage;

// Fix the leftover "Important" sentence that still mentions "listed holiday"
msg = msg.replace(
  /Important: If the user selects a Sunday or a listed holiday, politely inform them the clinic is closed that day and ask for an alternative date\./gi,
  'Important: If the user selects a Sunday, politely inform them the clinic is closed that day and ask for an alternative date.'
);

agent.parameters.options.systemMessage = msg;

// Final verification — print all holiday/closed related lines
const lines = msg.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Closed') || l.includes('Sunday') || l.includes('holiday') || l.includes('Maharashtra') || l.includes('Important')) {
    console.log(i + ':', l);
  }
});

fs.writeFileSync('dashboard_api_workflows.json', JSON.stringify(data, null, 2));
console.log('\nSaved.');
