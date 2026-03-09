const fs = require('fs');
const data = fs.readFileSync('sheet.html', 'utf8');
const matches = data.match(/gid\\?":\\?"(\d+)/g) || data.match(/gid":(\d+)/g) || data.match(/gid\\?":(\d+)/g);
console.log(matches);
const names = data.match(/name\\?":\\?"([^"]+)/g) || data.match(/name":"([^"]+)/g);
console.log(names ? names.slice(0, 20) : 'no names');
