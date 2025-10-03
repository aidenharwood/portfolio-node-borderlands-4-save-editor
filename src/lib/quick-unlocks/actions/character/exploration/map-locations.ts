import { deepClone } from '../../../../utils'
import { LOCATIONS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockMapLocationsAction: QuickUnlockAction = {
  id: 'unlock-map-locations',
  label: 'Reveal All Locations',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    updatedData.gbx_discovery_pg.dlblob = LOCATIONS.join(':2:');
    return {
      data: updatedData,
      warnings: undefined
    }
  }
}