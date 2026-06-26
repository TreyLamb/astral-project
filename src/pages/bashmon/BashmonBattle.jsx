import { useBashmon } from './BashmonApp';
import * as engine from './bashmonEngine';
import ITEMS_DATA from '../gitmon/content/items.json';
import GameBattle from '../shared/GameBattle';

const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

// BashMon (red branch) area money table — must stay on red branch
const AREA_MONEY = {
  // Phase 1
  pallet_town: 3, route_1: 4, viridian_city: 4, route_22: 5,
  route_2: 5, viridian_forest: 5, pewter_city: 6, route_3: 8,
  route_3_rest: 8, mt_moon_1: 9, mt_moon_2: 9, mt_moon_3: 10, route_4: 10,
  // Phase 2
  cerulean_city: 12, route_25: 13, bills_house: 14,
  // Phase 3
  route_5: 15, underground_path: 15, route_6: 16, vermilion_city: 18, ss_anne: 18,
  // Phase 4
  route_11: 22, route_11_gate: 22, rock_tunnel_entrance: 24, rock_tunnel_b1f: 25,
  lavender_town: 25, pokemon_tower: 27,
  // Phase 5
  route_7: 28, celadon_city: 30,
  // Phase 6
  route_16: 32, route_17: 33, route_18: 34, fuchsia_city: 35, safari_zone: 35, route_15: 34,
  // Phase 7
  route_8: 36, saffron_city: 40, silph_co: 45,
  // Phase 8
  route_21: 48, cinnabar_island: 50, pokemon_mansion: 52,
  route_22_ext: 55, victory_road_1: 60, victory_road_2: 62, victory_road_3: 65, indigo_plateau: 70,
  // Legacy GitMon area names
  listfield: 5, filebrook: 15, pattern_gorge: 25, process_peak: 35,
  netfall_city: 45, sudo_summit: 55, pipe_plains: 65, versionpeak: 75,
};

export default function BashmonBattle() {
  const { save, updateSave } = useBashmon();
  return (
    <GameBattle
      save={save}
      updateSave={updateSave}
      engine={engine}
      itemsMap={ITEMS_MAP}
      areaMoney={AREA_MONEY}
      p="bm"
      overworldPath="/bashmon/overworld"
      defaultArea="pallet_town"
      gameName="Bashmon"
      cmdPlaceholder="bash ..."
      accentColor="#ff6b35"
    />
  );
}
