import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

export const completeAugerMinesAction: QuickUnlockAction = {
  id: 'complete-auger-mines',
  label: 'Complete Auger Mines',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}
    updatedData.stats.openworld.activities.bounties_augur = updatedData.stats.openworld.activities.bounties_augur || {}
    
    REGIONS.forEach((region: Region) => {
      for (let i = 0; i < region.augurBounties; i++) {
        updatedData.stats.openworld.activities.bounties_augur[`augurbounty_${region.name}_${i + 1}`] = 1

        updatedData.missions.local_sets.missionset_zoneactivity_mine = updatedData.missions.local_sets.missionset_zoneactivity_mine || { missions: {} }
        updatedData.missions.local_sets.missionset_zoneactivity_mine.missions[`zoneactivity_${region.name}_mine${i + 1}`] = {
          status: "completed",
          final: {
            find_the_entrance_to_the_mine_endstate: "completed"
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
