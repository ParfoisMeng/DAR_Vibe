// ============================================================
//  Run 状态机 & 效果应用器（Day 5）
// ============================================================

import type {
  RunState, Stats, SkillNode, Synergy, Equipment,
  EquipSlot, SpiritRoot,
} from '../types';
import { defaultStats, defaultMeta } from '../types';
import { detectSynergies, collectSkillTags, findNewSynergies } from '../data/synergies';
import { collectAffixTags } from '../data/affixes';

// ── RunState 初始化 ──────────────────────────────────────────

export function createNewRun(spiritRoot: SpiritRoot): RunState {
  return {
    runId: `run_${Date.now()}`,
    spiritRoot,
    currentZone: 0,
    currentNodeIndex: 0,
    phase: 'zoneStart',
    stats: applyStartingBonus(defaultStats(), spiritRoot),
    equippedItems: {},
    inventory: [],
    skillTree: [],
    activeSynergies: [],
    materials: 0,
    daoYun: 0,
    heavenlyMomentHistory: [],
    combatCount: 0,
    synergyTriggerCount: 0,
  };
}

function applyStartingBonus(stats: Stats, spiritRoot: SpiritRoot): Stats {
  const s = { ...stats };
  if (spiritRoot === 'sword') {
    // 纯阳剑灵根：攻击力+10%，暴击率+5%
    s.atk = Math.round(s.atk * 1.10);
    s.critRate += 0.05;
  }
  return s;
}

// ── 功法节点效果应用 ─────────────────────────────────────────

export function applySkillNode(stats: Stats, node: SkillNode): Stats {
  const s = { ...stats };
  switch (node.effectKey) {
    case 'passive_swordIntentAccumulate':
      // 效果由战斗引擎处理，这里只更新标记
      break;
    case 'passive_swordDance':
      s.atkSpeed *= (1 + node.effectValue);
      break;
    case 'passive_swordHeart':
      s.critRate += node.effectValue;
      break;
    case 'passive_pureYangQi':
      s.atk = Math.round(s.atk * (1 + node.effectValue));
      break;
    case 'passive_ironBody':
      s.maxHp = Math.round(s.maxHp * (1 + node.effectValue));
      s.hp = s.maxHp;
      break;
    case 'passive_fortune':
      s.luckDrop += node.effectValue;
      break;
    case 'passive_daoSense':
      s.fateDest += node.effectValue;
      break;
    case 'passive_swiftSteps':
      s.dodge += node.effectValue;
      s.atkSpeed *= 1.08;
      break;
    case 'passive_heavenStep':
      s.dodge += node.effectValue;
      break;
    case 'passive_trueSword':
      // 效果由战斗引擎检测剑意层数后动态处理
      break;
    case 'passive_daoHeart':
      // 累积效果，每次境界突破时+3%（战斗外）
      break;
    case 'passive_swordWill':
      // Boss阶段变化不消散剑意，由天机时刻处理
      break;
    case 'passive_endurance':
      // 低血量时效果，由战斗引擎动态处理
      break;
    case 'passive_materialEye':
      s.luckDrop += node.effectValue;
      break;
    case 'conditional_voidStrike':
    case 'conditional_swordIntentBurst':
    case 'conditional_bloodThirst':
    case 'conditional_focusedStrike':
      // 条件触发效果在战斗引擎中处理
      break;
    case 'active_slashSoul':
    case 'active_trueQiShield':
      // 主动技能在Boss战天机时刻中处理
      break;
  }
  return s;
}

// ── 装备效果应用 ──────────────────────────────────────────────

export function applyEquipment(stats: Stats, equip: Equipment): Stats {
  let s = { ...stats };
  for (const affix of equip.affixes) {
    s = applyAffix(s, affix.effectKey, affix.effectValue);
  }
  return s;
}

function applyAffix(stats: Stats, effectKey: string, value: number): Stats {
  const s = { ...stats };
  switch (effectKey) {
    case 'affix_atk':          s.atk += value; break;
    case 'affix_maxHp':        s.maxHp += value; s.hp = Math.min(s.hp + value, s.maxHp); break;
    case 'affix_atkSpeed':     s.atkSpeed *= (1 + value / 100); break;
    case 'affix_critRate':     s.critRate += value / 100; break;
    case 'affix_dmgReduce':    s.dmgReduce += value / 100; break;
    case 'affix_luckDrop':     s.luckDrop += value / 100; break;
    case 'affix_onKillHeal':   break; // 战斗引擎处理
    case 'affix_coldSnap':     break; // 战斗引擎处理
    case 'affix_lowHpAtkBoost':break; // 战斗引擎处理
    case 'affix_thunderProc':  break; // 战斗引擎处理
    case 'affix_swordIntentSurge': break; // 战斗引擎动态处理
    case 'affix_trueQiOnActive': break;
    case 'affix_voidCombo':    break;
    case 'affix_shieldBreak':  break;
    case 'affix_berserker':    break;
  }
  return s;
}

// ── 协同效果应用 ──────────────────────────────────────────────

export function applySynergyEffects(stats: Stats, synergies: Synergy[]): Stats {
  let s = { ...stats };
  for (const syn of synergies) {
    switch (syn.baseEffectKey) {
      case 'syn_swordIntentAccumRate':
        // 剑意积累速度+50%，由战斗引擎处理
        break;
      case 'syn_critGainSwordIntent':
        // 暴击时剑意增量，由战斗引擎处理
        break;
      case 'syn_burstCooldownReduce':
        // 爆发类技能冷却-20%，由天机时刻处理
        break;
      case 'syn_swordVoidMaster':
        // 双倍剑意积累，由战斗引擎处理
        break;
      case 'syn_pureYangAscend':
        // 史诗协同，由战斗引擎处理
        break;
    }
  }
  return s;
}

// ── 功法节点选择 & 协同更新 ──────────────────────────────────

export function pickSkillNode(
  state: RunState,
  node: SkillNode,
): { newState: RunState; newSynergies: Synergy[] } {
  const newTree = [...state.skillTree, node];
  const newStats = applySkillNode(state.stats, node);

  // 重新检测协同
  const skillTags = collectSkillTags(newTree);
  const affixTags = collectAffixTags(Object.values(state.equippedItems).filter(Boolean) as Equipment[]);
  const allTags = [...new Set([...skillTags, ...affixTags])];
  const newSynergies = detectSynergies(allTags);
  const triggeredNow = findNewSynergies(state.activeSynergies, newSynergies);

  const newState: RunState = {
    ...state,
    skillTree: newTree,
    stats: newStats,
    activeSynergies: newSynergies,
    synergyTriggerCount: state.synergyTriggerCount + triggeredNow.length,
  };

  return { newState, newSynergies: triggeredNow };
}

// ── 装备决策 ──────────────────────────────────────────────────

export function equipItem(state: RunState, equip: Equipment): RunState {
  const slot = equip.slot;
  const oldEquip = state.equippedItems[slot];

  // 卸除旧装备效果（简化：重新计算全部装备效果）
  let newStats = applyStartingBonus(defaultStats(), state.spiritRoot);
  // 重新应用所有功法节点
  for (const node of state.skillTree) {
    newStats = applySkillNode(newStats, node);
  }
  // 应用所有装备（含新装备）
  const newEquipped = { ...state.equippedItems, [slot]: equip };
  for (const item of Object.values(newEquipped).filter(Boolean) as Equipment[]) {
    newEquipped[item.slot] && (newStats = applyEquipment(newStats, item));
  }

  // 保持HP比例
  const hpRatio = state.stats.hp / state.stats.maxHp;
  newStats.hp = Math.round(newStats.maxHp * hpRatio);

  // 更新协同
  const skillTags = collectSkillTags(state.skillTree);
  const affixTags = collectAffixTags(Object.values(newEquipped).filter(Boolean) as Equipment[]);
  const allTags = [...new Set([...skillTags, ...affixTags])];
  const newSynergies = detectSynergies(allTags);

  // 将旧装备（如果有）放入仓库/待处理
  const newInventory = oldEquip
    ? [...state.inventory.filter(i => i.instanceId !== oldEquip.instanceId)]
    : state.inventory;

  return {
    ...state,
    equippedItems: newEquipped,
    stats: newStats,
    activeSynergies: newSynergies,
    inventory: newInventory,
  };
}

export function discardItem(state: RunState, instanceId: string): RunState {
  return {
    ...state,
    inventory: state.inventory.filter(i => i.instanceId !== instanceId),
  };
}

// ── 战斗后更新状态 ────────────────────────────────────────────

export function applyPostCombat(
  state: RunState,
  swordIntentGain: number,
  playerHpRemain: number,
  playerShieldRemain: number,
  loot?: Equipment,
): RunState {
  const newSI = Math.min(100, state.stats.swordIntent + swordIntentGain);
  const newStats = {
    ...state.stats,
    swordIntent: newSI,
    hp: playerHpRemain,
    shield: playerShieldRemain,
  };

  const newInventory = loot ? [...state.inventory, loot] : state.inventory;

  return {
    ...state,
    stats: newStats,
    inventory: newInventory,
    combatCount: state.combatCount + 1,
    daoYun: state.daoYun + (state.combatCount > 0 ? 10 : 5),
  };
}

// ── 天机时刻决策记录 ─────────────────────────────────────────

export function recordHeavenlyMoment(
  state: RunState,
  momentId: string,
  chosenOption: string,
  conditionMet: boolean,
): RunState {
  const record = `${momentId}|${chosenOption}|${conditionMet ? 'met' : 'unmet'}`;
  return {
    ...state,
    heavenlyMomentHistory: [...state.heavenlyMomentHistory, record],
  };
}
