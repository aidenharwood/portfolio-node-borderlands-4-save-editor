/**
 * Debug: Compare our Base85 decode with README example
 */

import { b85DecodeToHex, hexToBin } from './src/lib/nicnl-decoder';

// From README example:
// Serial: @Ugy3L+2}TYgj66_jRG}7?s7KX9%/mS}4=NOD6e<_$90C
// Expected after Base85 decode + bit mirror:
// Hex: 2107060190627044313c0a962a8568a915e2abc2b3c2b654f05428562854e8573840
// Binary: 00100001000001110000011000000001100100000110001001110000010001000011000100111100000010101001011000101010100001010110100010101001000101011110001010101011110000101011001111000010101101100101010011110000010101000010100001010110001010000101010011101000010101110011100001000000

console.log("README Example Analysis");
console.log("=".repeat(80));

const readmeSerial = "@Ugy3L+2}TYgj66_jRG}7?s7KX9%/mS}4=NOD6e<_$90C";
const expectedHex = "2107060190627044313c0a962a8568a915e2abc2b3c2b654f05428562854e8573840";
const expectedBin = "00100001000001110000011000000001100100000110001001110000010001000011000100111100000010101001011000101010100001010110100010101001000101011110001010101011110000101011001111000010101101100101010011110000010101000010100001010110001010000101010011101000010101110011100001000000";

console.log("\nSerial:", readmeSerial);
console.log("\nExpected (from README):");
console.log("Hex:", expectedHex);
console.log("Bin:", expectedBin.slice(0, 100) + "...");

const ourHex = b85DecodeToHex(readmeSerial);
const ourBin = hexToBin(ourHex || "");

console.log("\nOur implementation:");
console.log("Hex:", ourHex);
console.log("Bin:", ourBin.slice(0, 100) + "...");

console.log("\n" + "=".repeat(80));
if (ourHex === expectedHex) {
  console.log("✅ HEX MATCHES!");
} else {
  console.log("❌ Hex mismatch");
  console.log("\nFirst 32 chars comparison:");
  console.log("Expected:", expectedHex.slice(0, 32));
  console.log("Got:     ", ourHex?.slice(0, 32));
}

if (ourBin === expectedBin) {
  console.log("✅ BINARY MATCHES!");
} else {
  console.log("❌ Binary mismatch");
  console.log("\nFirst 100 bits comparison:");
  console.log("Expected:", expectedBin.slice(0, 100));
  console.log("Got:     ", ourBin.slice(0, 100));
}

// Check for the level marker
console.log("\n" + "=".repeat(80));
console.log("Searching for level marker: 00000011001000001100");
const markerIndex = ourBin.indexOf("00000011001000001100");
if (markerIndex >= 0) {
  console.log(`✅ Marker found at bit position ${markerIndex}`);
} else {
  console.log("❌ Marker NOT found in our binary");
}

const expectedMarkerIndex = expectedBin.indexOf("00000011001000001100");
if (expectedMarkerIndex >= 0) {
  console.log(`✅ Marker found at bit position ${expectedMarkerIndex} in README example`);
} else {
  console.log("❌ Marker NOT found in README example either");
}
