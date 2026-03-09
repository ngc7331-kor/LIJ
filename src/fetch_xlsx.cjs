const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("sheet.xlsx");
https.get('https://docs.google.com/spreadsheets/d/1wJowMQqb5NtfZb38xj_3DS7GdvG17NOMThrn7zP9OF0/export?format=xlsx', function(response) {
  if (response.statusCode === 307 || response.statusCode === 302) {
    https.get(response.headers.location, function(res) {
      res.pipe(file);
      file.on('finish', function() {
        file.close(() => console.log('done'));
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', function() {
      file.close(() => console.log('done'));
    });
  }
});
