import fs from 'fs';
const file = '/app/page.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/bg-\[#0B1120\]/g, 'bg-bg-app');
code = code.replace(/bg-\[#0F172A\]/g, 'bg-bg-sidebar');
code = code.replace(/text-white/g, 'text-text-main');
code = code.replace(/text-slate-400/g, 'text-text-sec');
code = code.replace(/text-slate-300/g, 'text-text-main');
code = code.replace(/text-slate-500/g, 'text-text-sec');
code = code.replace(/border-slate-800/g, 'border-border-main');
code = code.replace(/border-slate-700/g, 'border-border-light');
code = code.replace(/bg-slate-800\/50/g, 'bg-bg-card');
code = code.replace(/bg-slate-800/g, 'bg-border-light');
code = code.replace(/bg-slate-900/g, 'bg-bg-app');
code = code.replace(/text-slate-200/g, 'text-text-main');

fs.writeFileSync(file, code);
console.log('done!');
