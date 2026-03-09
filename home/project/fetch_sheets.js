const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1wJowMQqb5NtfZb38xj_3DS7GdvG17NOMThrn7zP9OF0/edit', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const regex = /"name":"([^"]+)","gid":"(\d+)"/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log(`${match[1]}: ${match[2]}`);
    }
  });
});
