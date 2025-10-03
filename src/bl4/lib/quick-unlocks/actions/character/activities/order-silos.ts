import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

export const completeOrderSilosAction: QuickUnlockAction = {
  id: 'complete-order-silos',
  label: 'Complete Order Silos',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []
    
    REGIONS.forEach((region: Region) => {
      for (let i = 0; i < region.silos; i++) {
        updatedData.missions.local_sets.missionset_zoneactivity_silo = updatedData.missions.local_sets.missionset_zoneactivity_silo || { missions: {} }
        updatedData.missions.local_sets.missionset_zoneactivity_silo.missions[`zoneactivity_${region.name}_silo${i + 1}`] = {
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
