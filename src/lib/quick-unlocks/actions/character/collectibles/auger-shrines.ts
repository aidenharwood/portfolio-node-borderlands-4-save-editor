import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const collectAugerShrinesAction: QuickUnlockAction = {
  id: 'collect-auger-shrines',
  label: 'Collect Auger Shrines',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.shrines = updatedData.stats.openworld.collectibles.shrines || {}

    for (const region of REGIONS) {
      for (let i = 0; i < region.shrines; i++) {
        updatedData.stats.openworld.collectibles.shrines[`shrine_${region.name}_${i + 1}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
