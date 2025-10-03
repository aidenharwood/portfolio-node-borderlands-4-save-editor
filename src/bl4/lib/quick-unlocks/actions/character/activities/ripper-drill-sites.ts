import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

export const completeRipperDrillSitesAction: QuickUnlockAction = {
  id: 'complete-ripper-drill-sites',
  label: 'Complete Ripper Drill Sites',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}
    updatedData.stats.openworld.activities.bounties_vanguard = updatedData.stats.openworld.activities.bounties_vanguard || {}

    REGIONS.forEach((region: Region) => {
      for (let i = 0; i < region.vanguardBounties; i++) {
        updatedData.stats.openworld.activities.bounties_vanguard[`vanguardbounty_${region.name}_${i + 1}`] = 1

        updatedData.missions.local_sets.missionset_zoneactivity_drillsite = updatedData.missions.local_sets.missionset_zoneactivity_drillsite || { missions: {} }
        updatedData.missions.local_sets.missionset_zoneactivity_drillsite.missions[`zoneactivity_${region.name}_drillsite${i + 1}`] = {
          status: "completed",
          final: {
            kill_the_boss: "completed"
          }
        }
      }
    })

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
