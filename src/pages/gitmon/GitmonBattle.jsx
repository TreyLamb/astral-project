import { useGitmon } from './GitmonApp';
import * as engine from './gitmonEngine';
import ITEMS_DATA from './content/items.json';
import GameBattle from '../shared/GameBattle';

const ITEMS_MAP = Object.fromEntries(ITEMS_DATA.items.map(i => [i.id, i]));

// GitMon (blue branch) area money table — must stay on blue branch
const AREA_MONEY = {
  repo_town: 3, path_1: 4, status_city: 4, path_22: 5,
  path_2: 5, add_forest: 5, commit_city: 6, path_3: 8,
  path_3_rest: 8, conflict_cave_1: 9, conflict_cave_2: 9, conflict_cave_3: 10, path_4: 10,
  initfields: 5, branch_forest: 15, merge_valley: 25,
  remote_shores: 35, log_mountain: 45, stash_cave: 55,
  reset_ridge: 65, origin_peak: 75,
};

export default function GitmonBattle() {
  const { save, updateSave } = useGitmon();
  return (
    <GameBattle
      save={save}
      updateSave={updateSave}
      engine={engine}
      itemsMap={ITEMS_MAP}
      areaMoney={AREA_MONEY}
      p="gm"
      overworldPath="/gitmon/overworld"
      defaultArea="repo_town"
      gameName="Gitmon"
      cmdPlaceholder="git ..."
      accentColor="#7ec8e3"
    />
  );
}
