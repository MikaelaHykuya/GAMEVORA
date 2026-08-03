import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const options = {
  hostname: new URL(env.VITE_SUPABASE_URL).hostname,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': env.VITE_SUPABASE_ANON_KEY
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const swagger = JSON.parse(body);
    console.log('Tables:', Object.keys(swagger.definitions));
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
