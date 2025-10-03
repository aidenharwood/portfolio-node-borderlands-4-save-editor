import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const collectEvocariumsAction: QuickUnlockAction = {
  id: 'collect-evocariums',
  label: 'Collect Evocariums',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.evocariums = updatedData.stats.openworld.collectibles.evocariums || {}

    for (const region of REGIONS) {
      for (let i = 0; i < region.evocariums; i++) {
        updatedData.stats.openworld.collectibles.evocariums[`evocarium_${region.name}_${i + 1}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
