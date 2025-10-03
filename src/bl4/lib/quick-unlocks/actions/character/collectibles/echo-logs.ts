import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

const REGION_SLUG_MAP: Record<string, string> = {
  'mountains': 'mtn',
  'grasslands': 'gra',
  'shatteredlands': 'sha',
  'elpis': 'elp',
  'city': 'city',
}

export const collectEchoLogsAction: QuickUnlockAction = {
  id: 'collect-echo-logs',
  label: 'Collect Echo Logs',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.echologs_general = updatedData.stats.openworld.collectibles.echologs_general || {}
    updatedData.stats.openworld.collectibles.echologs_arjay = updatedData.stats.openworld.collectibles.echologs_arjay || {}
    updatedData.stats.openworld.collectibles.echologs_vaulthunter = updatedData.stats.openworld.collectibles.echologs_vaulthunter || {}

    // General logs
    for (const region of REGIONS) {
      for (let i = 0; i < region.echologs_general_gen; i++) {
        const paddedIndex = (i + 1).toString().padStart(2, '0')
        updatedData.stats.openworld.collectibles.echologs_general = updatedData.stats.openworld.collectibles.echologs_general || {}
        updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`] = updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`] || {}
        updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`][`${REGION_SLUG_MAP[region.name]}_gen_${paddedIndex}`] = 1
      }
      for (let i = 0; i < region.echologs_general_mis; i++) {
        const paddedIndex = (i + 1).toString().padStart(2, '0')
        updatedData.stats.openworld.collectibles.echologs_general = updatedData.stats.openworld.collectibles.echologs_general || {}
        updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`] = updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`] || {}
        updatedData.stats.openworld.collectibles.echologs_general[`el_g_${region.name}`][`${REGION_SLUG_MAP[region.name]}_mis_${paddedIndex}`] = 1
      }

      for (let i = 0; i < region.echologs_arjay; i++) {
        const paddedIndex = (i + 1).toString().padStart(2, '0')
        updatedData.stats.openworld.collectibles.echologs_arjay[`el_a_${region.name}`] = updatedData.stats.openworld.collectibles.echologs_arjay[`el_a_${region.name}`] || {}
        updatedData.stats.openworld.collectibles.echologs_arjay[`el_a_${region.name}`][`${REGION_SLUG_MAP[region.name]}_arj_${paddedIndex}`] = 1
      }

      for (let i = 0; i < region.echologs_vaulthunter; i++) {
        const paddedIndex = (i + 1).toString().padStart(2, '0')
        updatedData.stats.openworld.collectibles.echologs_vaulthunter[`el_vh_${region.name}`] = updatedData.stats.openworld.collectibles.echologs_vaulthunter[`el_vh_${region.name}`] || {}
        updatedData.stats.openworld.collectibles.echologs_vaulthunter[`el_vh_${region.name}`][`${REGION_SLUG_MAP[region.name]}_vh_${paddedIndex}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
