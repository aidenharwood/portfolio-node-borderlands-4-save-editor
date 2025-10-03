import { deepClone } from '../../../../utils'
import { WORLDS, LEVELS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const revealMapAction: QuickUnlockAction = {
  id: 'reveal-map',
  label: 'Reveal Map',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.gbx_discovery_pc.foddatas = WORLDS.map((level) => ({
      levelname: level,
      foddimensionx: 128,
      foddimensiony: 128,
      compressiontype: 'Zlib',
      foddata: 'eJztwTEBAAAAwqD+qWcMH6AAAAAAAAAAAAAAAAAAAACAtwGw2cOy'
    }));

    WORLDS.forEach((level: any) => {
      updatedData.stats.regions = updatedData.stats.regions || {}
      updatedData.stats.regions[level] = updatedData.stats.regions[level] || {}
      updatedData.stats.regions[level].discovered = 1
      updatedData.stats.regions[level].region_kills = updatedData.stats.regions[level].region_kills > 1 ? updatedData.stats.regions[level].region_kills : 1
    });

    LEVELS.forEach((level: any) => {
      updatedData.stats.regions = updatedData.stats.regions || {}
      updatedData.stats.regions[level] = updatedData.stats.regions[level] || {}
      updatedData.stats.regions[level].discovered = 1
      updatedData.stats.regions[level].region_kills = updatedData.stats.regions[level].region_kills > 1 ? updatedData.stats.regions[level].region_kills : 1
    });

    updatedData.gbx_discovery_pc.metrics.hasseenworldlist = WORLDS;
    updatedData.gbx_discovery_pc.metrics.hasseenregionlist = LEVELS;

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}