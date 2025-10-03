import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockAllSafehousesAction: QuickUnlockAction = {
  id: 'unlock-safehouses',
  label: 'Unlock All Safehouses',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    // add key to openworld.activities.safehouses[safehouse_grasslands_1] = 1
    REGIONS.forEach((region: Region) => {
      for (let i = 0; i < region.safehouses; i++) {
        updatedData.stats = updatedData.stats || {}
        updatedData.stats.openworld = updatedData.stats.openworld || {}
        updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}
        updatedData.stats.openworld.activities.safehouses = updatedData.stats.openworld.activities.safehouses || {}
        updatedData.stats.openworld.activities.safehouses[`safehouse_${region.name}_${i + 1}`] = 1

        updatedData.missions.local_sets.missionset_zoneactivity_safehouse.missions[`zoneactivity_${region.name}_safehouse${i + 1}`] = {
          status: "completed",
          final: {
            fact_lightson: true,
            find_the_datapad_enstate: "completed",
            claim_the_command_console_endstate: "completed"
          }
        }
        // Override for stupid claptrap house
        updatedData.missions.local_sets.missionset_zoneactivity_safehouse.missions['grasslands_safehousemain'] = {
          status: "completed",
          final: {
            fact_lightson: true,
            find_the_datapad_enstate: "completed",
            claim_the_command_console_endstate: "completed"
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