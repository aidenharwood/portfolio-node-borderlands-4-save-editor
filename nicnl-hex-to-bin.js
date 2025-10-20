function hexToBin(hex){
    hex = hex.replace("0x", "").toLowerCase();
    let out = "";
    for(let c of hex) {
        switch(c) {
            case '0': out += "0000"; break;
            case '1': out += "0001"; break;
            case '2': out += "0010"; break;
            case '3': out += "0011"; break;
            case '4': out += "0100"; break;
            case '5': out += "0101"; break;
            case '6': out += "0110"; break;
            case '7': out += "0111"; break;
            case '8': out += "1000"; break;
            case '9': out += "1001"; break;
            case 'a': out += "1010"; break;
            case 'b': out += "1011"; break;
            case 'c': out += "1100"; break;
            case 'd': out += "1101"; break;
            case 'e': out += "1110"; break;
            case 'f': out += "1111"; break;
            default: return "";
        }
    }

    return out;
}

function hexToBase4(hex) {
    let out = "";
    for(let c of hex) {
        switch(c) {
            case '0': out += "00"; break;
            case '1': out += "01"; break;
            case '2': out += "02"; break;
            case '3': out += "03"; break;
            case '4': out += "10"; break;
            case '5': out += "11"; break;
            case '6': out += "12"; break;
            case '7': out += "13"; break;
            case '8': out += "20"; break;
            case '9': out += "21"; break;
            case 'a': out += "22"; break;
            case 'b': out += "23"; break;
            case 'c': out += "30"; break;
            case 'd': out += "31"; break;
            case 'e': out += "32"; break;
            case 'f': out += "33"; break;
        }
    }
    return out;
}

function b16FromB02(b02) {
    let b16 = '';
    for (let i = 0; i < b02.length; i += 4) {
        let nibble = b02.slice(i, i + 4);
        let h = parseInt(nibble, 2).toString(16);
        b16 += h;
    }
    return b16;
}

export { hexToBin, hexToBase4, b16FromB02 };
