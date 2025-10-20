import { parseDeserialized, serializeToString } from './src/lib/nicnl-decoder';

const test1 = "269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|";

console.log("Test 1:");
console.log("Input:", test1);
const parsed = parseDeserialized(test1);
console.log("Parsed:");
console.log("  itemType:", parsed.itemType);
console.log("  version:", parsed.version);
console.log("  fields:", JSON.stringify(parsed.fields));
console.log("  parts:", JSON.stringify(parsed.parts));
console.log();
console.log("Serialized back:");
const serialized = serializeToString(parsed);
console.log("  ", serialized);
console.log();
console.log("Match:", test1 === serialized ? "✅ YES" : "❌ NO");
