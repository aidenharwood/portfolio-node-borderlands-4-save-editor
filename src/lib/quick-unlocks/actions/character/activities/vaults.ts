import { deepClone } from '../../../../utils'
import { REGIONS, type Region } from '../../../constants'

import type { QuickUnlockAction } from '../../../types'

const indexToLetter = (index: number): string => {
  return String.fromCharCode(97 + index); // 0 -> 'a', 1 -> 'b', 2 -> 'c'
}

export const completeAllVaultsAction: QuickUnlockAction = {
  id: 'complete-vaults',
  label: 'Complete Vaults',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.activities = updatedData.stats.openworld.activities || {}

    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.vaultdoor = updatedData.stats.openworld.collectibles.vaultdoor || {}
    updatedData.stats.openworld.collectibles.vaultlock = updatedData.stats.openworld.collectibles.vaultlock || {}
    REGIONS.forEach((region: Region) => {
      if (region.vaultdata != null) {
        updatedData.stats.openworld.collectibles.vaultdoor[`vaultdoor_${region.name}`] = 1
        updatedData.stats.openworld.collectibles.vaultlock[`vaultlock_${region.name}`] = 1
        updatedData.stats.openworld.collectibles[`vaultpower_${region.name}`] = 1
        for (let i = 0; i < 3; i++) {
          updatedData.stats.openworld.collectibles[`vaultkey_${region.name}`] = updatedData.stats.openworld.collectibles[`vaultkey_${region.name}`] || {}
          updatedData.stats.openworld.collectibles[`vaultkey_${region.name}`][`vaultkey_${indexToLetter(i)}_${region.name}`] = 1
        }
        updatedData.missions.local_sets[`missionset_vault_${region.name}`] = {
          status: 'completed',
          missions: {
            [region.vaultdata.mission]: {
              ui_flags: 1,
              status: 'completed',
              final: region.vaultdata.endStates.reduce((acc: any, state: string) => {
                acc[state] = 'completed'
                return acc
              }, {}),
            },
          }
        }
      }
    })

    const vaultNodes = [
      { name: 'Vault Power Upgrade 1 - Increased Regen Speed', is_activated: true },
      { name: 'Vault Power Upgrade 2 - Reduced Regen Delay', is_activated: true },
      { name: 'Vault Power Upgrade 3 - 50% Cost Reduction per Move', is_activated: true },
    ]

    const graphs: any[] = updatedData.progression.graphs
    const targetIndex = graphs.findIndex((graph) => graph?.name === 'vaultpower_vaultreward_upgrades')

    if (targetIndex >= 0) {
      const existing = graphs[targetIndex] ?? {}
      graphs[targetIndex] = { ...existing, name: 'vaultpower_vaultreward_upgrades', nodes: vaultNodes }
    } else {
      graphs.push({ name: 'vaultpower_vaultreward_upgrades', nodes: vaultNodes })
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
