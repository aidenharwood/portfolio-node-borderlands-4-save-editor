/**
 * Character-related save file sections
 */

import type { SerializableSection, FieldDefinition } from './base'

export function resolveClassName(classId: string): string {
    for (const option of CLASS_OPTIONS) {
        if (option.value === classId) {
            return option.label
        }
    }
    return 'Unknown'
}

const CLASS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'Char_DarkSiren', label: 'Siren' },
    { value: 'Char_Paladin', label: 'Forgeknight' },
    { value: 'Char_Gravitar', label: 'Gravitar' },
    { value: 'Char_ExoSoldier', label: 'Exo Soldier' }
]

/**
 * Character basic information from state section
 */
export class CharacterInfoSection implements SerializableSection {
    readonly id = 'character'
    readonly title = 'Character Info'
    readonly description = 'Basic character information and progress'
    readonly icon = 'pi pi-user'

    readonly fields: FieldDefinition[] = [
        {
            path: 'state.char_name',
            name: 'Character Name',
            type: 'string',
            placeholder: 'Enter character name',
            validation: (value) => typeof value === 'string' && value.length > 0
        },
        {
            path: 'state.class',
            name: 'Character Class',
            type: 'select',
            options: CLASS_OPTIONS,
            validation: (value) => typeof value === 'string' && value.startsWith('Char_')
        },
        {
            path: 'state.player_difficulty',
            name: 'Difficulty',
            type: 'select',
            options: [
                { value: 'Normal', label: 'Normal' },
                { value: 'Hard', label: 'Hard' },
                { value: 'VeryHard', label: 'Very Hard' },
                { value: 'Extreme', label: 'Extreme' }
            ],
            validation: (value) => ['Normal', 'Hard', 'VeryHard', 'Extreme'].includes(value)
        },
        {
            path: 'state.experience.0.level',
            name: 'Character Level',
            type: 'number',
            min: 1,
            max: 50,
            step: 1,
            validation: (value) => Number.isInteger(value) && value >= 1 && value <= 50
        },
        {
            path: 'state.experience.0.points',
            name: 'Character EXP',
            type: 'number',
            min: 0,
            step: 1,
            validation: (value) => Number.isInteger(value) && value >= 0
        },
        {
            path: 'state.experience.1.level',
            name: 'Specialization Level',
            type: 'number',
            min: 1,
            max: 200,
            step: 1,
            validation: (value) => Number.isInteger(value) && value >= 1 && value <= 200
        },
        {
            path: 'state.experience.1.points',
            name: 'Specialization EXP',
            type: 'number',
            min: 0,
            step: 1,
            validation: (value) => Number.isInteger(value) && value >= 0
        },
        {
            path: 'state.inventory.equip_slots_unlocked',
            name: 'Unlocked Equipment Slots',
            type: 'multiselect',
            options: [
                { value: 2, label: 'Weapon 3' },
                { value: 3, label: 'Weapon 4' },
                { value: 6, label: 'Repkit' },
                { value: 7, label: 'Enhancement' },
                { value: 8, label: 'Class Mod' }
            ],
            validation: (value) => Array.isArray(value) && value.every(v => Number.isInteger(v) && v >= 0 && v <= 8)
        },
        {
            path: 'state.inventory.active_slot',
            name: 'Active Weapon Slot',
            type: 'select',
            options: [
                { value: 0, label: 'Weapon Slot 1' },
                { value: 1, label: 'Weapon Slot 2' },
                { value: 2, label: 'Weapon Slot 3' },
                { value: 3, label: 'Weapon Slot 4' }
            ],
            validation: (value) => Number.isInteger(value) && value >= 0 && value <= 3
        },
        {
            path: 'state.vehicle_weapon_slot',
            name: 'Vehicle Weapon Slot',
            type: 'select',
            options: [
                { value: 1, label: 'Machine Gun' },
                { value: 2, label: 'Rocket Launcher' }
            ],
            validation: (value) => Number.isInteger(value) && (value === 1 || value === 2)
        }
    ]


    serialize(data: any): Record<string, any> {
        const stateObj: Record<string, any> = {
            char_guid: data.state?.char_guid || '',
            char_name: data.state?.char_name || '',
            class: data.state?.class || 'Char_DarkSiren',
            player_difficulty: data.state?.player_difficulty || 'Normal',
            experience: data.state?.experience || [
                { type: 'Character', level: 1, points: 0 },
                { type: 'Specialization', level: 1, points: 0 }
            ],
            inventory: {
                equip_slots_unlocked: data.state?.inventory?.equip_slots_unlocked || []
            },
            inventory_active_slot: data.state?.inventory_active_slot ?? data.state?.active_slot ?? 0,
            vehicle_weapon_slot: data.state?.vehicle_weapon_slot || 1
        }

        return { state: stateObj }
    }

    deserialize(data: Record<string, any>): any {
        return data.state || {}
    }

    validate(data: any): boolean {
        return data && data.state && typeof data.state.char_guid === 'string'
    }
}