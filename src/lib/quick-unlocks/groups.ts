// Defines groups/sections for quick unlock actions for better UI organization
// Each group has a label, icon, and a list of action IDs

export interface QuickUnlockGroup {
    id: string
    label: string
    icon?: string
    actionIds: string[]
}

export const CHARACTER_QUICK_UNLOCK_GROUPS: QuickUnlockGroup[] = [
    {
        id: 'progression',
        label: 'Progression',
        icon: 'pi pi-star',
        actionIds: [
            'unlock-all-sdus',
            'unlock-all-hoverdrives',
            'complete-all-missions',
        ]
    },
    {
        id: 'collectibles',
        label: 'Collectibles',
        icon: 'pi pi-trophy',
        actionIds: [
            'collect-auger-shrines',
            'collect-evocariums',
            'collect-lost-capsules',
            'collect-propaganda-speakers',
            'collect-survivalist-caches',
            'collect-vault-symbols',
            'collect-echo-logs',
            'collect-electi-safes',
        ]
    },
    {
        id: 'activities',
        label: 'Activities',
        icon: 'pi pi-bolt',
        actionIds: [
            'complete-vaults',
            'complete-ancient-crawlers',
            'complete-auger-mines',
            'complete-order-bunkers',
            'complete-order-silos',
            'complete-ripper-drill-sites',
        ]
    },
    {
        id: 'exploration',
        label: 'Exploration',
        icon: 'pi pi-map',
        actionIds: [
            'reveal-map',
            'unlock-map-locations',
            'unlock-safehouses',
        ]
    },
    {
        id: 'cosmetics',
        label: 'Cosmetics',
        icon: 'pi pi-star',
        actionIds: [
            'unlock-reward-packs',
        ]
    },
]


export const PROFILE_QUICK_UNLOCK_GROUPS: QuickUnlockGroup[] = [
    // {
    //     id: 'placeholder',
    //     label: 'Placeholder',
    //     icon: 'pi pi-star',
    //     actionIds: [
    //         // Placeholder
    //     ]
    // }
    {
        id: 'cosmetics',
        label: 'Cosmetics',
        icon: 'pi pi-star',
        actionIds: [
            'unlock-shinies',
            'unlock-cosmetics',
        ]
    },
]
