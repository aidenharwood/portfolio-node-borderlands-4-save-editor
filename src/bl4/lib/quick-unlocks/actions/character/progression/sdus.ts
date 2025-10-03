import { deepClone } from '../../../../utils'
import { ALL_SDU_NODES } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockAllSdusAction: QuickUnlockAction = {
  id: 'unlock-all-sdus',
  label: 'Unlock All SDUs',
  icon: 'pi pi-lock',
  run(data: any) {
    const updatedData = deepClone(data ?? {})

    if (!updatedData.progression) {
      updatedData.progression = {}
    }

    if (!Array.isArray(updatedData.progression.graphs)) {
      updatedData.progression.graphs = []
    }

    const graphs: any[] = updatedData.progression.graphs
    const targetIndex = graphs.findIndex((graph) => graph?.name === 'sdu_upgrades')

    if (targetIndex >= 0) {
      const existing = graphs[targetIndex] ?? {}
      graphs[targetIndex] = { ...existing, name: 'sdu_upgrades', nodes: ALL_SDU_NODES }
    } else {
      graphs.push({ name: 'sdu_upgrades', nodes: ALL_SDU_NODES })
    }

    return { data: updatedData }
  }
}
