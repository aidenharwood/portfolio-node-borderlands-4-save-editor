// Item type mapping: ID -> { manufacturer, weaponType }
export const ITEM_TYPE_MAP: Record<number, { manufacturer: string; weaponType: string }> = {
  2: { manufacturer: 'Daedalus', weaponType: 'Pistol' },
  3: { manufacturer: 'Jakobs', weaponType: 'Pistol' },
  4: { manufacturer: 'Order', weaponType: 'Pistol' },
  5: { manufacturer: 'Tediore', weaponType: 'Pistol' },
  6: { manufacturer: 'Torgue', weaponType: 'Pistol' },
  7: { manufacturer: 'Ripper', weaponType: 'Shotgun' },
  8: { manufacturer: 'Daedalus', weaponType: 'Shotgun' },
  9: { manufacturer: 'Jakobs', weaponType: 'Shotgun' },
  10: { manufacturer: 'Maliwan', weaponType: 'Shotgun' },
  11: { manufacturer: 'Tediore', weaponType: 'Shotgun' },
  12: { manufacturer: 'Torgue', weaponType: 'Shotgun' },
  13: { manufacturer: 'Daedalus', weaponType: 'Assault Rifle' },
  14: { manufacturer: 'Tediore', weaponType: 'Assault Rifle' },
  15: { manufacturer: 'Order', weaponType: 'Assault Rifle' },
  16: { manufacturer: 'Vladof', weaponType: 'Sniper' },
  17: { manufacturer: 'Torgue', weaponType: 'Assault Rifle' },
  18: { manufacturer: 'Vladof', weaponType: 'Assault Rifle' },
  19: { manufacturer: 'Ripper', weaponType: 'SMG' },
  20: { manufacturer: 'Daedalus', weaponType: 'SMG' },
  21: { manufacturer: 'Maliwan', weaponType: 'SMG' },
  22: { manufacturer: 'Vladof', weaponType: 'SMG' },
  23: { manufacturer: 'Ripper', weaponType: 'Sniper' },
  24: { manufacturer: 'Jakobs', weaponType: 'Sniper' },
  25: { manufacturer: 'Maliwan', weaponType: 'Sniper' },
  26: { manufacturer: 'Order', weaponType: 'Sniper' },
  27: { manufacturer: 'Jakobs', weaponType: 'Assault Rifle' },
  
  // Class Mods
  254: { manufacturer: 'Siren', weaponType: 'Class Mod' },
  255: { manufacturer: 'Forgeknight', weaponType: 'Class Mod' },
  256: { manufacturer: 'Exo Soldier', weaponType: 'Class Mod' },
  259: { manufacturer: 'Gravitar', weaponType: 'Class Mod' },
  
  // Gear items (Repair Kits, Gadgets, Enhancements, Shields, Heavy)
  261: { manufacturer: 'Torgue', weaponType: 'Repair Kit' },
  263: { manufacturer: 'Maliwan', weaponType: 'Gadget' },
  264: { manufacturer: 'Hyperion', weaponType: 'Enhancement' },
  265: { manufacturer: 'Jakobs', weaponType: 'Repair Kit' },
  266: { manufacturer: 'Maliwan', weaponType: 'Repair Kit' },
  267: { manufacturer: 'Jakobs', weaponType: 'Gadget' },
  268: { manufacturer: 'Jakobs', weaponType: 'Enhancement' },
  269: { manufacturer: 'Vladof', weaponType: 'Repair Kit' },
  270: { manufacturer: 'Daedalus', weaponType: 'Gadget' },
  271: { manufacturer: 'Maliwan', weaponType: 'Enhancement' },
  272: { manufacturer: 'Order', weaponType: 'Gadget' },
  273: { manufacturer: 'Torgue', weaponType: 'Sniper' },
  274: { manufacturer: 'Ripper', weaponType: 'Repair Kit' },
  275: { manufacturer: 'Ripper', weaponType: 'Heavy' },
  277: { manufacturer: 'Daedalus', weaponType: 'Repair Kit' },
  278: { manufacturer: 'Ripper', weaponType: 'Gadget' },
  279: { manufacturer: 'Maliwan', weaponType: 'Shield' },
  281: { manufacturer: 'Order', weaponType: 'Enhancement' },
  282: { manufacturer: 'Vladof', weaponType: 'Heavy' },
  283: { manufacturer: 'Vladof', weaponType: 'Shield' },
  284: { manufacturer: 'Atlas', weaponType: 'Enhancement' },
  285: { manufacturer: 'Order', weaponType: 'Repair Kit' },
  286: { manufacturer: 'COV', weaponType: 'Enhancement' },
  287: { manufacturer: 'Tediore', weaponType: 'Shield' },
  289: { manufacturer: 'Maliwan', weaponType: 'Heavy' },
  290: { manufacturer: 'Tediore', weaponType: 'Repair Kit' },
  291: { manufacturer: 'Vladof', weaponType: 'Gadget' },
  292: { manufacturer: 'Tediore', weaponType: 'Enhancement' },
  293: { manufacturer: 'Order', weaponType: 'Shield' },
  296: { manufacturer: 'Ripper', weaponType: 'Enhancement' },
  298: { manufacturer: 'Torgue', weaponType: 'Gadget' },
  299: { manufacturer: 'Daedalus', weaponType: 'Enhancement' },
  300: { manufacturer: 'Ripper', weaponType: 'Shield' },
  303: { manufacturer: 'Torgue', weaponType: 'Enhancement' },
  306: { manufacturer: 'Jakobs', weaponType: 'Shield' },
  310: { manufacturer: 'Vladof', weaponType: 'Enhancement' },
  311: { manufacturer: 'Tediore', weaponType: 'Gadget' },
  312: { manufacturer: 'Daedalus', weaponType: 'Shield' },
  321: { manufacturer: 'Torgue', weaponType: 'Shield' },
};

export function getItemTypeName(itemType: number): string {
  const item = ITEM_TYPE_MAP[itemType];
  if (!item) return `Unknown (${itemType})`;
  if (item.manufacturer === 'Unknown') return `Type ${itemType}`;
  return `${item.manufacturer} ${item.weaponType}`;
}

export function getManufacturer(itemType: number): string {
  return ITEM_TYPE_MAP[itemType]?.manufacturer || 'Unknown';
}

export function getWeaponType(itemType: number): string {
  return ITEM_TYPE_MAP[itemType]?.weaponType || 'Unknown';
}
