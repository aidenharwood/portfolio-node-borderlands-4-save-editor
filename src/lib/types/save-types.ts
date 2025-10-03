/**
 * TypeScript Type Definitions Based on Actual BL4 YAML Structure
 * Derived from analysis of real character.yaml and profile.yaml files
 */

// ===== CHARACTER SAVE TYPES =====

/**
 * Experience entry for character and specialization levels
 */
export interface ExperienceEntry {
  type: 'Character' | 'Specialization'
  level: number
  points: number
}

/**
 * Individual item in backpack or bank
 */
export interface InventoryItem {
  serial: string
  flags?: number
  state_flags?: number
}

/**
 * Backpack inventory with slot-based storage
 */
export interface BackpackInventory {
  [slotKey: `slot_${number}`]: InventoryItem
}

/**
 * Equipped inventory (items currently equipped)
 * Each slot can contain an array of items
 */
export interface EquippedInventory {
  [slotKey: `slot_${number}`]: InventoryItem[]
}

/**
 * Complete inventory structure
 */
export interface InventoryState {
  items: {
    backpack: BackpackInventory
  }
  equipped: EquippedInventory
}

/**
 * Equipment slots unlocked array
 */
export type EquipSlotsUnlocked = number[]

/**
 * Challenge objective structure
 */
export interface ChallengeObjective {
  challenge_ident: string
  challenge_bitfield: number[]
}

/**
 * Progression node in skill tree
 */
export interface ProgressionNode {
  name: string
  is_activated?: boolean
  points_spent?: number
}

/**
 * Progression graph (skill tree)
 */
export interface ProgressionGraph {
  name: string
  group_def_name: string
  nodes: ProgressionNode[]
}

/**
 * Character progression/skill trees
 */
export interface CharacterProgression {
  graphs: ProgressionGraph[]
}

/**
 * Stats tracking (simplified - actual structure is very complex)
 */
export interface CharacterStats {
  [statName: string]: any
}

/**
 * Mission data (simplified - actual structure is complex)
 */
export interface MissionData {
  [missionId: string]: any
}

/**
 * Main character state
 */
export interface CharacterState {
  resource_pools?: any
  char_guid: string
  class: string
  char_name: string
  player_difficulty: 'Normal' | 'Hard' | 'VeryHard' | 'Extreme'
  experience: ExperienceEntry[]
  inventory: InventoryState
  equip_slots_unlocked: EquipSlotsUnlocked
  active_slot: number
  player_customization?: any
  blackmarket_cooldown?: number
  challenge_objectives?: ChallengeObjective[]
}

/**
 * Save game header
 */
export interface SaveGameHeader {
  version: number
  package_id: string
  engine_version: string
  custom_format_version: number
  custom_format_data_count: number
}

/**
 * Complete BL4 character save file structure
 */
export interface BL4CharacterSave {
  state: CharacterState
  onlinecharacterprefs?: Record<string, any>
  pips?: Record<string, any>
  globals?: Record<string, any>
  stats?: CharacterStats
  gbx_discovery_pc?: Record<string, any>
  gbx_discovery_pg?: Record<string, any>
  missions?: MissionData
  save_game_header?: SaveGameHeader
  progression?: CharacterProgression
  unlockables?: Record<string, any>
  world_state?: Record<string, any>
  activities?: Record<string, any>
  timed_facts?: Record<string, any>
}

// ===== PROFILE SAVE TYPES =====

/**
 * Input preferences structure
 */
export interface InputPreferences {
  toggle_zoom: boolean
  toggle_crouch: boolean
  toggle_sprint: boolean
  enable_dash: boolean
  censor_content: boolean
  display_damage_numbers: boolean
  look_sensitivity_horizontal: number
  look_sensitivity_vertical: number
  ads_sensitivity_horizontal: number
  ads_sensitivity_vertical: number
  motion_controls_look_sensitivity_horizontal: number
  motion_controls_look_sensitivity_vertical: number
  motion_controls_ads_sensitivity_horizontal: number
  motion_controls_ads_sensitivity_vertical: number
  motion_controls_setting: number
  jcms_look_sensitivity_horizontal: number
  jcms_look_sensitivity_vertical: number
  jcms_ads_sensitivity_horizontal: number
  jcms_ads_sensitivity_vertical: number
  jcms_enable_control: number
  controller_ads_snap: boolean
  mouse_ads_snap: boolean
  controller_aim_assist: boolean
  controller_aim_recentering: boolean
  camera_head_bob: number
  mantle_with_forward: boolean
  invert_look_x_axis_kbm: boolean
  invert_look_y_axis_kbm: boolean
  invert_move_x_axis_kbm: boolean
  invert_move_y_axis_kbm: boolean
  invert_look_x_axis_gamepad: boolean
  invert_look_y_axis_gamepad: boolean
  invert_move_x_axis_gamepad: boolean
  invert_move_y_axis_gamepad: boolean
  left_stick_radial_dead_zone_inner: number
  left_stick_radial_dead_zone_outer: number
  left_stick_axial_dead_zone_inner: number
  left_stick_axial_dead_zone_outer: number
  right_stick_radial_dead_zone_inner: number
  right_stick_radial_dead_zone_outer: number
  right_stick_axial_dead_zone_inner: number
  right_stick_axial_dead_zone_outer: number
  use_toggle_glide_kbm: boolean
  use_toggle_glide_gamepad: boolean
  crosshair_position: number
  compass_vertical_indicator_config: number
  radar_enabled: number
  vehicle_fov: number
  map_viewer_zoom_speed: number
}

/**
 * UI preferences structure
 */
export interface UIPreferences {
  hud_scale: number
  subtitle_mode: number
  subtitle_scale: number
  text_chat_visible: boolean
  voice_chat_push_to_talk: boolean
  voice_chat_open_mic_threshold: number
  [key: string]: any // UI has many more settings
}

/**
 * Audio preferences structure  
 */
export interface AudioPreferences {
  master_volume: number
  sfx_volume: number
  music_volume: number
  voice_volume: number
  ui_volume: number
  cinematics_volume: number
  [key: string]: any // Audio has many more settings
}

/**
 * Online preferences structure
 */
export interface OnlinePreferences {
  playfab_id: string
  shifty_id: string
  display_cross_promotion: boolean
  [key: string]: any
}

/**
 * Bank item structure (simpler than backpack items)
 */
export interface BankItem {
  serial: string
  state_flags: number
}

/**
 * Bank storage structure
 */
export interface BankStorage {
  [slotKey: `slot_${number}`]: BankItem
}

/**
 * Shared inventory structure
 */
export interface SharedInventory {
  items: {
    bank: BankStorage
  }
}

/**
 * Character selection data
 */
export interface CharacterData {
  [characterKey: string]: any
}

/**
 * Local domain data
 */
export interface LocalDomain {
  characters_selected: string
  characters: CharacterData
  shared: {
    inventory: SharedInventory
  }
  blackmarket_items?: Record<string, any>
  shared_progress?: {
    unlocked_hints: string[]
  }
}

/**
 * Domains structure
 */
export interface Domains {
  local: LocalDomain
}

/**
 * Complete BL4 profile save file structure
 */
export interface BL4ProfileSave {
  inputprefs: InputPreferences
  ui?: UIPreferences
  onlineprefs?: OnlinePreferences
  domains: Domains
  echoprefs?: Record<string, any>
  ui_screen_data?: Record<string, any>
  audioprefs?: AudioPreferences
  deep_freeze_pips?: Record<string, any>
  save_game_header?: SaveGameHeader
  pips?: Record<string, any>
}

// ===== UNION TYPES AND TYPE GUARDS =====

/**
 * Union type for any BL4 save file
 */
export type BL4SaveFile = BL4CharacterSave | BL4ProfileSave

/**
 * Type guard to check if save file is a character save
 */
export function isCharacterSave(saveFile: any): saveFile is BL4CharacterSave {
  return saveFile && 
         typeof saveFile.state === 'object' &&
         typeof saveFile.state.char_guid === 'string' &&
         typeof saveFile.state.char_name === 'string'
}

/**
 * Type guard to check if save file is a profile save
 */
export function isProfileSave(saveFile: any): saveFile is BL4ProfileSave {
  return saveFile && (
    typeof saveFile.inputprefs === 'object' ||
    typeof saveFile.domains === 'object'
  )
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate character state structure
 */
export function validateCharacterState(state: any): state is CharacterState {
  return typeof state === 'object' &&
         typeof state.char_guid === 'string' &&
         typeof state.char_name === 'string' &&
         typeof state.class === 'string' &&
         Array.isArray(state.experience) &&
         typeof state.inventory === 'object'
}

/**
 * Validate inventory item structure
 */
export function validateInventoryItem(item: any): item is InventoryItem {
  return typeof item === 'object' &&
         typeof item.serial === 'string' &&
         (item.flags === undefined || typeof item.flags === 'number') &&
         (item.state_flags === undefined || typeof item.state_flags === 'number')
}

/**
 * Validate bank item structure
 */
export function validateBankItem(item: any): item is BankItem {
  return typeof item === 'object' &&
         typeof item.serial === 'string' &&
         typeof item.state_flags === 'number'
}

/**
 * Validate input preferences structure
 */
export function validateInputPreferences(prefs: any): prefs is InputPreferences {
  return typeof prefs === 'object' &&
         typeof prefs.look_sensitivity_horizontal === 'number' &&
         typeof prefs.look_sensitivity_vertical === 'number' &&
         typeof prefs.toggle_zoom === 'boolean' &&
         typeof prefs.toggle_crouch === 'boolean'
}

// ===== HELPER FUNCTIONS =====

/**
 * Create empty character save with default values
 */
export function createEmptyCharacterSave(): BL4CharacterSave {
  return {
    state: {
      char_guid: '',
      class: 'Char_DarkSiren',
      char_name: '',
      player_difficulty: 'Normal',
      experience: [
        { type: 'Character', level: 1, points: 0 },
        { type: 'Specialization', level: 1, points: 0 }
      ],
      inventory: {
        items: {
          backpack: {}
        },
        equipped: {}
      },
      equip_slots_unlocked: [2, 3, 6, 7, 8],
      active_slot: 1
    }
  }
}

/**
 * Create empty profile save with default values
 */
export function createEmptyProfileSave(): BL4ProfileSave {
  return {
    inputprefs: {
      toggle_zoom: false,
      toggle_crouch: true,
      toggle_sprint: true,
      enable_dash: true,
      censor_content: false,
      display_damage_numbers: true,
      look_sensitivity_horizontal: 1.0,
      look_sensitivity_vertical: 1.0,
      ads_sensitivity_horizontal: 1.0,
      ads_sensitivity_vertical: 1.0,
      motion_controls_look_sensitivity_horizontal: 1.0,
      motion_controls_look_sensitivity_vertical: 1.0,
      motion_controls_ads_sensitivity_horizontal: 1.0,
      motion_controls_ads_sensitivity_vertical: 1.0,
      motion_controls_setting: 0,
      jcms_look_sensitivity_horizontal: 1.0,
      jcms_look_sensitivity_vertical: 1.0,
      jcms_ads_sensitivity_horizontal: 1.0,
      jcms_ads_sensitivity_vertical: 1.0,
      jcms_enable_control: 1,
      controller_ads_snap: true,
      mouse_ads_snap: false,
      controller_aim_assist: true,
      controller_aim_recentering: false,
      camera_head_bob: 1.0,
      mantle_with_forward: true,
      invert_look_x_axis_kbm: false,
      invert_look_y_axis_kbm: false,
      invert_move_x_axis_kbm: false,
      invert_move_y_axis_kbm: false,
      invert_look_x_axis_gamepad: false,
      invert_look_y_axis_gamepad: false,
      invert_move_x_axis_gamepad: false,
      invert_move_y_axis_gamepad: false,
      left_stick_radial_dead_zone_inner: 0.25,
      left_stick_radial_dead_zone_outer: 0.1,
      left_stick_axial_dead_zone_inner: 7.5,
      left_stick_axial_dead_zone_outer: 15.0,
      right_stick_radial_dead_zone_inner: 0.25,
      right_stick_radial_dead_zone_outer: 0.1,
      right_stick_axial_dead_zone_inner: 7.5,
      right_stick_axial_dead_zone_outer: 15.0,
      use_toggle_glide_kbm: false,
      use_toggle_glide_gamepad: true,
      crosshair_position: 1,
      compass_vertical_indicator_config: 0,
      radar_enabled: 1,
      vehicle_fov: 110.0,
      map_viewer_zoom_speed: 1.0
    },
    domains: {
      local: {
        characters_selected: 'C_1',
        characters: {
          c_1: {}
        },
        shared: {
          inventory: {
            items: {
              bank: {}
            }
          }
        }
      }
    }
  }
}