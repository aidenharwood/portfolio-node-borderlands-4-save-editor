import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const collectSurvivalistCachesAction: QuickUnlockAction = {
  id: 'collect-survivalist-caches',
  label: 'Collect Survivalist Caches',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.caches = updatedData.stats.openworld.collectibles.caches || {}

    for (const region of REGIONS) {
      for (let i = 0; i < region.caches; i++) {
        updatedData.stats.openworld.collectibles.caches[`cache_${region.name}_${i + 1}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
