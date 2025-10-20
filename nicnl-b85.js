const HANDLE_PREFIX = true;
let REVERSE_BITS = false;

// Byte order configuration: [0, 1, 2, 3] represents the position mapping
// Default [0, 1, 2, 3] = big-endian (most significant byte first)
// [3, 2, 1, 0] = little-endian (least significant byte first)
// You can use any permutation like [2, 3, 0, 1] for custom byte swapping
//let BYTE_ORDER = [0, 1, 2, 3];
let BYTE_ORDER = [3, 2, 1, 0];

function base85ChangeByteOrder(newOrder) {
    if (newOrder.length !== 4 || new Set(newOrder).size !== 4 || !newOrder.every(i => i >= 0 && i < 4)) {
        throw new Error("Invalid byte order configuration");
    }
    BYTE_ORDER = newOrder;
}

function base85GetByteOrder() {
    return BYTE_ORDER;
}

//base85GetReverseBits, base85SetReverseBits
function base85GetReverseBits() {
    return REVERSE_BITS;
}

function base85SetReverseBits(value) {
    REVERSE_BITS = value;
}

// Helper function to apply byte order configuration
function applyByteOrder(bytes) {
    return [
        bytes[BYTE_ORDER[0]],
        bytes[BYTE_ORDER[1]],
        bytes[BYTE_ORDER[2]],
        bytes[BYTE_ORDER[3]]
    ];
}

// Helper function to reverse byte order configuration (for decoding)
function reverseByteOrder(bytes) {
    const result = new Array(4);
    result[BYTE_ORDER[0]] = bytes[0];
    result[BYTE_ORDER[1]] = bytes[1];
    result[BYTE_ORDER[2]] = bytes[2];
    result[BYTE_ORDER[3]] = bytes[3];
    return result;
}

const B85_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{/}~";

const reverseLookup = new Array(256).fill(0xFF);
for (let i = 0; i < B85_CHARSET.length; i++) {
    reverseLookup[B85_CHARSET.charCodeAt(i)] = i;
}

function b85Decode(string) {
    if (HANDLE_PREFIX) {
        if (string[0] !== '@' || string[1] !== 'U') return null;
        string = string.slice(2);
    }

    // Initialize reverse lookup table
    const result = [];
    let idx = 0;
    const size = string.length;

    while (idx < size) {
        let workingU32 = 0;
        let charCount = 0;

        // Collect up to 5 valid Base85 characters
        while (idx < size && charCount < 5) {
            const charCode = string.charCodeAt(idx);
            idx++;

            if (charCode >= 0 && reverseLookup[charCode] < 0x56) {
                workingU32 = workingU32 * 85 + reverseLookup[charCode];
                charCount++;
            }
        }

        if (charCount === 0) break;

        // Handle padding for incomplete groups
        if (charCount < 5) {
            const padding = 5 - charCount;
            for (let i = 0; i < padding; i++) {
                workingU32 = workingU32 * 85 + 0x7e; // '~' value
            }
        }

        if (charCount === 5) {
            // Full group - apply byte order transformation
            const standardBytes = [
                (workingU32 >>> 24) & 0xFF,
                (workingU32 >>> 16) & 0xFF,
                (workingU32 >>> 8) & 0xFF,
                (workingU32 >>> 0) & 0xFF
            ];

            const orderedBytes = reverseByteOrder(standardBytes);
            result.push(orderedBytes[0], orderedBytes[1], orderedBytes[2], orderedBytes[3]);
        } else {
            // Partial group - NO byte order transformation, just extract bytes normally
            const byteCount = charCount - 1;
            if (byteCount >= 1) result.push((workingU32 >>> 24) & 0xFF);
            if (byteCount >= 2) result.push((workingU32 >>> 16) & 0xFF);
            if (byteCount >= 3) result.push((workingU32 >>> 8) & 0xFF);
        }
    }

    // Reverse the bits in each byte
    // 76543210 => 01234567
    if (REVERSE_BITS) {
        for (let i = 0; i < result.length; i++) {
            let b = result[i];
            b = ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
            b = ((b & 0xCC) >> 2) | ((b & 0x33) << 2);
            b = ((b & 0xAA) >> 1) | ((b & 0x55) << 1);
            result[i] = b;
        }
    }

    // Convert byte array to hex string
    return result.map(b => b.toString(16).padStart(2, '0')).join('');
}

function b85Encode(hexString) {
    // Convert hex string to byte array
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
    }

    // Reverse the bits in each byte
    // 76543210 => 01234567
    if (REVERSE_BITS) {
        for (let i = 0; i < bytes.length; i++) {
            let b = bytes[i];
            b = ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
            b = ((b & 0xCC) >> 2) | ((b & 0x33) << 2);
            b = ((b & 0xAA) >> 1) | ((b & 0x55) << 1);
            bytes[i] = b;
        }
    }

    const result = [];
    let idx = 0;
    const len = bytes.length;
    const extraBytes = len & 3;
    const fullGroups = len >> 2;

    // Process full 4-byte groups
    for (let i = 0; i < fullGroups; i++) {
        // Read 4 bytes from hex string
        const inputBytes = [bytes[idx], bytes[idx + 1], bytes[idx + 2], bytes[idx + 3]];
        idx += 4;

        // Apply byte order transformation
        const orderedBytes = applyByteOrder(inputBytes);

        // Combine into 32-bit value
        let u32 = (orderedBytes[0] << 24) | (orderedBytes[1] << 16) |
                  (orderedBytes[2] << 8) | orderedBytes[3];
        u32 = u32 >>> 0; // Convert to unsigned 32-bit

        // Divide by powers of 85 to extract Base85 digits
        result.push(B85_CHARSET[Math.floor(u32 / 52200625)]); // 85^4
        const rem1 = u32 % 52200625;
        result.push(B85_CHARSET[Math.floor(rem1 / 614125)]); // 85^3
        const rem2 = rem1 % 614125;
        result.push(B85_CHARSET[Math.floor(rem2 / 7225)]); // 85^2
        const rem3 = rem2 % 7225;
        result.push(B85_CHARSET[Math.floor(rem3 / 85)]); // 85^1
        result.push(B85_CHARSET[rem3 % 85]); // 85^0
    }

    // Handle remaining bytes (1-3) - NO byte order transformation for partial groups
    if (extraBytes !== 0) {
        let lastU32 = bytes[idx];
        if (extraBytes >= 2) {
            lastU32 = (lastU32 << 8) | bytes[idx + 1];
        }
        if (extraBytes === 3) {
            lastU32 = (lastU32 << 8) | bytes[idx + 2];
        }

        // Shift to appropriate position
        let workingU32;
        if (extraBytes === 3) {
            workingU32 = lastU32 << 8;
        } else if (extraBytes === 2) {
            workingU32 = lastU32 << 16;
        } else {
            workingU32 = lastU32 << 24;
        }
        workingU32 = workingU32 >>> 0;

        // Encode partial group
        result.push(B85_CHARSET[Math.floor(workingU32 / 52200625)]);
        const rem1 = workingU32 % 52200625;
        result.push(B85_CHARSET[Math.floor(rem1 / 614125)]);

        if (extraBytes >= 2) {
            const rem2 = rem1 % 614125;
            result.push(B85_CHARSET[Math.floor(rem2 / 7225)]);

            if (extraBytes === 3) {
                const rem3 = rem2 % 7225;
                result.push(B85_CHARSET[Math.floor(rem3 / 85)]);
            }
        }
    }

    if (HANDLE_PREFIX)
        return '@U' + result.join('');
    else
        return result.join('');
}

export { b85Decode, b85Encode, base85ChangeByteOrder, base85GetByteOrder, base85GetReverseBits, base85SetReverseBits };
