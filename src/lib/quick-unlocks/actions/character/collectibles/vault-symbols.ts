import { deepClone } from '../../../../utils'
import { REGIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const collectVaultSymbolsAction: QuickUnlockAction = {
  id: 'collect-vault-symbols',
  label: 'Collect Vault Symbols',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    updatedData.stats = updatedData.stats || {}
    updatedData.stats.openworld = updatedData.stats.openworld || {}
    updatedData.stats.openworld.collectibles = updatedData.stats.openworld.collectibles || {}
    updatedData.stats.openworld.collectibles.vaultsymbols = updatedData.stats.openworld.collectibles.vaultsymbols || {}

    for (const region of REGIONS) {
      for (let i = 0; i < region.vaultsymbols; i++) {
        updatedData.stats.openworld.collectibles.vaultsymbols[`vaultsymbol_${region.name}_${i + 1}`] = 1
      }
    }

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
