import { deepClone } from "../../../../utils";
import type { QuickUnlockAction } from "../../../types";

export const unlockUvh5Action: QuickUnlockAction = {
  id: "unlock-uvh-5",
  label: "Unlock UVH 5",
  icon: "pi pi-lock",
  run(data: any) {
    const updatedData = deepClone(data ?? {});
    const warnings: string[] = [];

    const GLOBALS = {
      ...(updatedData.globals || {}),
      highest_unlocked_vault_hunter_level: 5,
      vault_hunter_level: 5,
    };

    updatedData.globals = GLOBALS;

    const STATS = {
      ...(updatedData.stats || {}),
      challenge: {
        ...(updatedData.stats?.challenge || {}),
        mission_uvh_1a: 1,
        mission_uvh_1b: 1,
        mission_uvh_1c: 1,
        uvh_1_finalchallenge: 1,
        mission_uvh_2a: 1,
        mission_uvh_2b: 1,
        mission_uvh_2c: 1,
        mission_uvh_2d: 1,
        uvh_2_finalchallenge: 1,
        mission_uvh_3a: 1,
        mission_uvh_3b: 1,
        mission_uvh_3c: 1,
        mission_uvh_3d: 1,
        uvh_3_finalchallenge: 1,
        mission_uvh_4a: 1,
        mission_uvh_4b: 1,
        mission_uvh_4c: 1,
        mission_uvh_4d: 1,
        uvh_4_finalchallenge: 1,
        mission_uvh_5a: 1,
        mission_uvh_5b: 1,
        mission_uvh_5c: 1,
        uvh_5_finalchallenge: 1,
      },
    };

    updatedData.stats = STATS;

    const MISSIONS = {
        ...(updatedData.missions.local_sets || {}),
      missionset_main_postgame: {
        status: "completed",
        cursorposition: 3,
        missions: {
          micro_uvh_blackmarkettutorial: {
            status: "completed",
          },
          micro_uvh_firmwaretransfertutorial: {
            status: "completed",
            exit: "Micro_UVH_FirmwareTransferTutorial_SHA_Exit",
          },
          micro_uvh_trait: {
            status: "completed",
            final: {
              talktolilith_endstate: "completed",
            },
          },
          micro_uvh_trueboss: {
            status: "completed",
            exit: "Exit",
          },
        },
      },
    };
    
    updatedData.missions.local_sets = MISSIONS;

    return {
      data: updatedData,
      warnings: warnings,
    };
  },
};
