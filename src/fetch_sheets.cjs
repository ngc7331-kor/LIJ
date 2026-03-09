const https = require('https');
const fs = require('fs');

https.get('https://docs.google.com/spreadsheets/d/1wJowMQqb5NtfZb38xj_3DS7GdvG17NOMThrn7zP9OF0/edit', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('sheet.html', data);
    console.log('done');
  });
});
