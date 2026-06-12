import { readFileSync } from 'fs';
import { parseMessage } from './src/hl7/parser';
import { analyzeIntegrity } from './src/hl7/validator';

const msg = readFileSync('msg.txt', 'utf-8');
const parsed = parseMessage(msg);
const report = analyzeIntegrity(parsed, []);

console.log('Missing Required Segments:');
console.log(JSON.stringify(report.missingRequiredSegments, null, 2));
