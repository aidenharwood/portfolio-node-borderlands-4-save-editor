import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

export const completeOrderBunkersAction: QuickUnlockAction = {
  id: 'complete-order-bunkers',
  label: 'Complete Order Bunkers',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}
    updatedData.stats.openworld.activities.bounties_order = updatedData.stats.openworld.activities.bounties_order || {}

    REGIONS.forEach((region: Region) => {
      for (let i = 0; i < region.orderBounties; i++) {
        updatedData.stats.openworld.activities.bounties_order[`orderbounty_${region.name}_${i + 1}`] = 1
        
        updatedData.missions.local_sets.missionset_zoneactivity_orderbunker = updatedData.missions.local_sets.missionset_zoneactivity_orderbunker || { missions: {} }
        updatedData.missions.local_sets.missionset_zoneactivity_orderbunker.missions[`zoneactivity_${region.name}_orderbunker${i + 1}`] = {
          status: "completed",
          final: {
            open_the_door_endstate: "completed"
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
