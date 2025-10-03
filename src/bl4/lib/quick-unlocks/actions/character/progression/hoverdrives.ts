import { deepClone } from '../../../../utils'
import { ALL_HOVERDRIVE_UNLOCKABLES, ALL_HOVERDRIVE_REWARDS, MANUFACTURERS } from '../../../constants'
import type { QuickUnlockAction } from '../../../types'

export const unlockAllHoverdrivesAction: QuickUnlockAction = {
  id: 'unlock-all-hoverdrives',
  label: 'Unlock All Hoverdrives',
  icon: 'pi pi-lock',
  run(data: any) {
    const updatedData = deepClone(data ?? {})
    const warnings: string[] = []

    if (!updatedData.unlockables) {
      updatedData.unlockables = {}
    }
    if (!updatedData.unlockables.unlockable_hoverdrives) {
      updatedData.unlockables.unlockable_hoverdrives = {}
    }
    updatedData.unlockables.unlockable_hoverdrives.entries = [...ALL_HOVERDRIVE_UNLOCKABLES]

    if (!updatedData.state) {
      updatedData.state = {}
    }

    const existingRewards = Array.isArray(updatedData.state.unique_rewards)
      ? updatedData.state.unique_rewards
      : []
    const mergedRewards = new Set<string>([...existingRewards, ...ALL_HOVERDRIVE_REWARDS])
    updatedData.state.unique_rewards = Array.from(mergedRewards)

    if (!updatedData.stats) {
      updatedData.stats = {}
    }

    const existingChallengeStats = typeof updatedData.stats.challenge === 'object' && updatedData.stats.challenge
      ? updatedData.stats.challenge
      : {}
    const updatedChallengeStats = { ...existingChallengeStats }

    MANUFACTURERS.forEach((manufacturer) => {
      updatedChallengeStats[`manufacturer_${manufacturer.toLowerCase()}_kills`] = 2000
    })

    updatedData.stats.challenge = updatedChallengeStats
    
    return {
      data: updatedData,
      warnings: warnings.length ? warnings : undefined
    }
  }
}
