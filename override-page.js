const fs = require('fs');

const content = `"use client";

import HomeClient from './page-client';

export default function Home() {
  return <HomeClient />;
}
`;

fs.writeFileSync('d:\\Salih KAVAKCI\\Yeni klasör\\FinAl\\final-web\\src\\app\\page.tsx', content, 'utf8');
console.log('Saved page.tsx correctly and optimized!');
