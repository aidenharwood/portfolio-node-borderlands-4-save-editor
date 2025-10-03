import { deepClone } from '../../../../utils'
import type { QuickUnlockAction } from '../../../types'
import { COSMETICS } from '../../../constants'

export const unlockAllCosmeticsAction: QuickUnlockAction = {
  id: 'unlock-cosmetics',
  label: 'Unlock All Cosmetics (Except Shinies)',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.domains.local.shared.unlockables = updatedData.domains.local.shared.unlockables || {}

    updatedData.domains.local.shared.unlockables.unlockable_echo4 = updatedData.domains.local.shared.unlockables.unlockable_echo4 || { entries: [] }
    COSMETICS.echo4.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_echo4.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_echo4.entries.push(cosmetic)
      }
    })

    updatedData.domains.local.shared.unlockables.unlockable_exosoldier = updatedData.domains.local.shared.unlockables.unlockable_exosoldier || { entries: [] }
    COSMETICS.exosoldier.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_exosoldier.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_exosoldier.entries.push(cosmetic)
      }
    });

    updatedData.domains.local.shared.unlockables.unlockable_paladin = updatedData.domains.local.shared.unlockables.unlockable_paladin || { entries: [] }
    COSMETICS.forgeknight.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_paladin.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_paladin.entries.push(cosmetic)
      }
    });

    updatedData.domains.local.shared.unlockables.unlockable_gravitar = updatedData.domains.local.shared.unlockables.unlockable_gravitar || { entries: [] }
    COSMETICS.gravitar.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_gravitar.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_gravitar.entries.push(cosmetic)
      }
    });

    updatedData.domains.local.shared.unlockables.unlockable_darksiren = updatedData.domains.local.shared.unlockables.unlockable_darksiren || { entries: [] }
    COSMETICS.siren.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_darksiren.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_darksiren.entries.push(cosmetic)
      }
    });

    updatedData.domains.local.shared.unlockables.unlockable_vehicles = updatedData.domains.local.shared.unlockables.unlockable_vehicles || { entries: [] }
    COSMETICS.vehicles.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_vehicles.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_vehicles.entries.push(cosmetic)
      }
    });

    updatedData.domains.local.shared.unlockables = updatedData.domains.local.shared.unlockables || {}
    updatedData.domains.local.shared.unlockables.unlockable_weapons = updatedData.domains.local.shared.unlockables.unlockable_weapons || { entries: [] }
    COSMETICS.weapons.forEach(cosmetic => {
      if (!updatedData.domains.local.shared.unlockables.unlockable_weapons.entries.includes(cosmetic)) {
        updatedData.domains.local.shared.unlockables.unlockable_weapons.entries.push(cosmetic)
      }
    });

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
