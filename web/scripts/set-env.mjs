import { writeFileSync, mkdirSync } from 'node:fs';

const apiBaseUrl = process.env.API_BASE_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;

if (!apiBaseUrl || !googleClientId) {
  console.error('Missing API_BASE_URL or GOOGLE_CLIENT_ID');
  process.exit(1);
}

const content = `export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl.replace(/\/$/, '')}',
  googleClientId: '${googleClientId}',
};
`;

mkdirSync('src/environments', { recursive: true });
writeFileSync('src/environments/environment.ts', content);
console.log('environment.ts generated');