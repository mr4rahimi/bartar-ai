import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG } from './config.mjs';

mkdirSync(CONFIG.stateDir, { recursive: true });
const file = join(CONFIG.stateDir, 'agent.log');
export function log(...a) {
  const line = `[${new Date().toISOString()}] ${a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')}`;
  console.log(line);
  try { appendFileSync(file, line + '\n'); } catch {}
}
