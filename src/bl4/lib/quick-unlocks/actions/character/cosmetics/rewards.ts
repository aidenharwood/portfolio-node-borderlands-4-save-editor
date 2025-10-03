import { deepClone } from '../../../../utils'
import { REWARD_PACKS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockAllRewardPacksAction: QuickUnlockAction = {
  id: 'unlock-reward-packs',
  label: 'Unlock All Reward Packs',
  icon: 'pi pi-lock',
  variant: 'secondary',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []
    
    updatedData.state.unique_rewards = updatedData.state.unique_rewards || []
    REWARD_PACKS.forEach(pack => {
      if (!updatedData.state.unique_rewards.includes(pack)) {
        updatedData.state.unique_rewards.push(pack)
      }
    });

    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
