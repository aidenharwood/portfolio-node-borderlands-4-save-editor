// The level bits position move around. But they seems to be always after this marker.
// 20 bits long => 1048576 combinations... good enough approximation.
const LEVEL_MARKER = '00000011001000001100';

function itemDecodeLevel(b02) {
    // Keep only 200 first bits, the level is always within this range
    if (b02.length >= 200) b02 = b02.slice(0, 200);

    let firstLevelBit = -1;
    let lastLevelBit = -1;

    // Figure out where the level marker is
    let markerIndex = b02.indexOf(LEVEL_MARKER);
    if (markerIndex === -1) return null;
    firstLevelBit = markerIndex + LEVEL_MARKER.length;

    // Discard everything before the marker
    b02 = b02.slice(markerIndex + LEVEL_MARKER.length);

    // The level cannot be more than 20 bits long
    if (b02.length >= 20) b02 = b02.slice(0, 20);

    // Read the varints (5 bits each)
    let levelBits = '';
    lastLevelBit = firstLevelBit;
    while (b02.length > 0) {
        // Should not happen
        if (b02.length < 5) return null;
        lastLevelBit += 5;

        // First 4 bits: level data
        let block = b02.slice(0, 5);
        levelBits += block.slice(0, 4);

        // 5th bit: continuation flag
        if (block[4] === '0') break;

        // Remove the processed bits
        b02 = b02.slice(5);
    }

    // The level bits are reversed
    levelBits = levelBits.split('').reverse().join('');

    // The level is 16bits, pad with zeros if needed
    while (levelBits.length < 16)
        levelBits = '0' + levelBits;

    // Read signed int16
    let level = parseInt(levelBits, 2);
    if (levelBits.length > 0 && levelBits[0] === '1')
        level -= (1 << levelBits.length);

    return {
        level,
        firstLevelBit,
        lastLevelBit,
    };
}

export { itemDecodeLevel };
