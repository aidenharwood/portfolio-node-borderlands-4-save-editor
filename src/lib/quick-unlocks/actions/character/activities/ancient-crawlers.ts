import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

export const completeAncientCrawlersAction: QuickUnlockAction = {
  id: 'complete-ancient-crawlers',
  label: 'Complete Ancient Crawlers',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}
    updatedData.stats.openworld.activities.crawlers = updatedData.stats.openworld.activities.crawlers || {}

    REGIONS.forEach((region: Region) => {      
      for (let i = 0; i < region.crawlers; i++) {
        updatedData.stats.openworld.activities.crawlers[`crawlers_${region.name}`] = updatedData.stats.openworld.activities.crawlers[`crawlers_${region.name}`] || {}
        updatedData.stats.openworld.activities.crawlers[`crawlers_${region.name}`][`crawler_${region.name}_${i + 1}`] = 1

        updatedData.missions.local_sets.missionset_zoneactivity_crawler = updatedData.missions.local_sets.missionset_zoneactivity_crawler || { missions: {} }
        updatedData.missions.local_sets.missionset_zoneactivity_crawler.missions[`zoneactivity_${region.name}_crawler${i + 1}`] = {
          status: "completed"
        }
      }
    })

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
