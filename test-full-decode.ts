import { decodeSerial, serializeToString } from './src/lib/nicnl-decoder';

const serial = '@Ugr%Scm/%Dy!t/Y>M^&nQZ9u!5Q2S`+$e>05';
const expected = '321, 0, 1, 28| 2, 2493|| {7} {10} {246:22} {237:9} {246:[51 3]} {6}|';

console.log('Serial:', serial);
console.log();

const decoded = decodeSerial(serial);
console.log('Decoded:', JSON.stringify(decoded, null, 2));
console.log();

const serialized = serializeToString(decoded!);
console.log('Serialized:', serialized);
console.log('Expected:  ', expected);
console.log('Match:', serialized === expected ? '✅ YES' : '❌ NO');
