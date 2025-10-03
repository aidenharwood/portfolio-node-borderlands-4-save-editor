/**
 * Profile-related save file sections
 */

import type { SerializableSection, FieldDefinition } from './base'

/**
 * Input preferences section from profile save
 */
export class InputPreferencesSection implements SerializableSection {
  readonly id = 'inputPreferences'
  readonly title = 'Input Settings'
  readonly description = 'Mouse, keyboard, and controller settings'
  readonly icon = 'pi pi-cog'
  
  readonly fields: FieldDefinition[] = [
    {
      path: 'inputprefs.look_sensitivity_horizontal',
      name: 'Horizontal Look Sensitivity',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      validation: (value) => typeof value === 'number' && value >= 0.1 && value <= 5.0
    },
    {
      path: 'inputprefs.look_sensitivity_vertical',
      name: 'Vertical Look Sensitivity', 
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      validation: (value) => typeof value === 'number' && value >= 0.1 && value <= 5.0
    },
    {
      path: 'inputprefs.toggle_zoom',
      name: 'Toggle Zoom',
      type: 'boolean',
      validation: (value) => typeof value === 'boolean'
    },
    {
      path: 'inputprefs.toggle_crouch',
      name: 'Toggle Crouch',
      type: 'boolean',
      validation: (value) => typeof value === 'boolean'
    },
    {
      path: 'inputprefs.toggle_sprint',
      name: 'Toggle Sprint',
      type: 'boolean',
      validation: (value) => typeof value === 'boolean'
    },
    {
      path: 'inputprefs.display_damage_numbers',
      name: 'Display Damage Numbers',
      type: 'boolean',
      validation: (value) => typeof value === 'boolean'
    },
    {
      path: 'inputprefs.controller_aim_assist',
      name: 'Controller Aim Assist',
      type: 'boolean',
      validation: (value) => typeof value === 'boolean'
    }
  ] as const

  serialize(data: any): Record<string, any> {
    return {
      inputprefs: {
        look_sensitivity_horizontal: data.inputprefs?.look_sensitivity_horizontal || 1.0,
        look_sensitivity_vertical: data.inputprefs?.look_sensitivity_vertical || 1.0,
        toggle_zoom: data.inputprefs?.toggle_zoom || false,
        toggle_crouch: data.inputprefs?.toggle_crouch || false,
        toggle_sprint: data.inputprefs?.toggle_sprint || false,
        display_damage_numbers: data.inputprefs?.display_damage_numbers || true,
        controller_aim_assist: data.inputprefs?.controller_aim_assist || true
      }
    }
  }

  deserialize(data: Record<string, any>): any {
    return data.inputprefs || {}
  }

  validate(data: any): boolean {
    return data && data.inputprefs && typeof data.inputprefs === 'object'
  }
}