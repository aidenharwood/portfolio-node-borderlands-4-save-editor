import { deepClone } from '../../../../utils'
import { COSMETICS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockAllShiniesAction: QuickUnlockAction = {
  id: 'unlock-shinies',
  label: 'Unlock All Shinies',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.domains.local.shared.unlockables.unlockable_weapons = updatedData.domains.local.shared.unlockables.unlockable_weapons || { entries: [] }
    COSMETICS.shinies.forEach(cosmetic => {
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
