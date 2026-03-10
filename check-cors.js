import https from 'https';

const data = JSON.stringify({ action: 'save', schedule: {}, members: [], user: 'test' });

const options = {
  hostname: 'script.google.com',
  path: '/macros/s/AKfycbyARqUA6BP6sKGKUv5sYEf8d_oDGdpDgkLFszyWXdQ5azvqZx69yzb3wnzmVP7uKvkIgA/exec',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  if (res.statusCode === 302) {
    const redirectOptions = {
      hostname: 'script.googleusercontent.com',
      path: res.headers.location.replace('https://script.googleusercontent.com', ''),
      method: 'POST', // fetch follows redirect with GET usually for 302, wait, 302 means GET!
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    };
    console.log('Redirecting to:', res.headers.location);
  }
});

req.on('error', (e) => {
  console.error(e);
});
req.write(data);
req.end();
