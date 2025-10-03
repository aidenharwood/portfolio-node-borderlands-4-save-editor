import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const collectElectiSafesAction: QuickUnlockAction = {
  id: 'collect-electi-safes',
  label: 'Collect Electi Safes',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.safes = updatedData.stats.openworld.collectibles.safes || {}

    for (const region of REGIONS) {
      for (let i = 0; i < region.safes; i++) {
        updatedData.stats.openworld.collectibles.safes[`safe_${region.name}_${i + 1}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
