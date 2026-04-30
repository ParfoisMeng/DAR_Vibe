// ============================================================
//  问道无界 Phase 0 主游戏控制器
// ============================================================

import * as CombatLog from './ui/combatLog';
import * as StatsPanel from './ui/statsPanel';
import * as SkillPickUI from './ui/skillPick';
import * as SkillTreeUI from './ui/skillTree';
import * as HMui from './ui/heavenlyMoment';
import * as EventUI from './ui/event';
import * as LootUI from './ui/loot';

import { calcCombat } from './engine/combat';
import { createNewRun, pickSkillNode, equipItem } from './engine/run';
import { ZONE1_ENEMIES, ZONE2_ENEMIES, BOSS_CANG_LANG } from './data/enemies';
import { BOSS_HEAVENLY_MOMENTS } from './data/heavenlyMoments';
import { getFirstEvent, getRandomEvent } from './data/events';
import { SYNERGIES_PHASE0 } from './data/synergies';
import { rollEquipment } from './data/affixes';
import { loadMeta, saveMeta, saveRunSnapshot, finalizeRun, exportSaveCode } from './save';

import type {
  RunState, SpiritRoot, Equipment, EquipSlot,
  Enemy, HeavenlyMomentOption, EventChoice, MetaData,
} from './types';

// ─── 全局状态 ────────────────────────────────────────────────────
let state!: RunState;
let meta!: MetaData;

// 全局执行结束标志（用于死亡时中断 runFlow）
let runAborted = false;

// ─── 行动区辅助 ──────────────────────────────────────────────────

function setAction(title: string, narrative: string, choices: Array<{ label: string; onClick: () => void; primary?: boolean; disabled?: boolean }>) {
  document.getElementById('action-title')!.textContent = title;
  document.getElementById('action-narrative')!.textContent = narrative;
  const el = document.getElementById('action-choices')!;
  el.innerHTML = '';
  for (const c of choices) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (c.primary ? ' primary' : '');
    btn.textContent = c.label;
    btn.disabled = !!c.disabled;
    btn.addEventListener('click', c.onClick);
    el.appendChild(btn);
  }
}

/** 等待单一按钮确认（用于自动步骤的"继续"） */
function waitContinue(label = '继续前行 →'): Promise<void> {
  return new Promise(resolve => {
    setAction('', '', [{ label, onClick: resolve, primary: true }]);
  });
}

/** 禁用行动区所有按钮（战斗动画播放时） */
function lockActions() {
  document.querySelectorAll<HTMLButtonElement>('#action-choices .btn').forEach(b => b.disabled = true);
}

// ─── UI 刷新 ────────────────────────────────────────────────────

function updateUI() {
  const s = state;
  const zoneName = s.currentZone === 0 ? '北荒边境（第一区）' : s.currentZone === 1 ? '幽冥古道（第二区）' : '苍狼王领地';
  StatsPanel.renderStats(s.stats, zoneName, s.combatCount, s.daoYun);
  StatsPanel.renderEquipSlot('eq-weapon', s.equippedItems['weapon'] ?? null);
  StatsPanel.renderEquipSlot('eq-armor', s.equippedItems['armor'] ?? null);
  StatsPanel.renderEquipSlot('eq-ring', s.equippedItems['ring'] ?? null);
  SkillTreeUI.renderSkillTree(s.skillTree);
  SkillTreeUI.renderSynergies(s.activeSynergies);
  // 天机图鉴：传入已发现的协同 ID 列表，renderJournal 内部从全局数据构建
  SkillTreeUI.renderJournal(meta.discoveredSynergies);
}

// ─── 战斗步骤 ────────────────────────────────────────────────────

async function doCombat(enemy: Enemy): Promise<void> {
  setAction(
    `战斗准备 · ${enemy.name}`,
    `前方出现${enemy.tier === 'elite' ? '精英' : enemy.tier === 'boss' ? 'Boss' : '普通'}敌人「${enemy.name}」\n${
      enemy.tier === 'normal' ? '（普通敌人不消耗根基，自动战斗）' :
      enemy.tier === 'elite' ? '（精英敌人，注意保存根基）' : '（Boss！天机时刻将改变战局！）'
    }`,
    []
  );
  await waitContinue('御剑出击 →');
  lockActions();

  const result = calcCombat(state.stats, enemy);

  // 播放日志
  CombatLog.appendLog({ type: 'system', text: `━━━ 战斗开始 · ${enemy.name} ━━━`, timestamp: 0 });
  await CombatLog.playLogs(result.logs);

  // 更新状态
  state = {
    ...state,
    combatCount: state.combatCount + 1,
    stats: {
      ...state.stats,
      hp: enemy.tier === 'normal' ? state.stats.hp : Math.max(0, result.playerHpRemain),
      shield: result.playerShieldRemain,
      swordIntent: Math.min(100, (state.stats.swordIntent ?? 0) + result.swordIntentGain),
    },
    daoYun: state.daoYun + (enemy.tier === 'normal' ? 1 : enemy.tier === 'elite' ? 5 : 20),
  };

  // 战斗结果日志
  const durationS = (result.durationMs / 1000).toFixed(1);
  if (result.victory) {
    CombatLog.appendLog({ type: 'system', text: `✓ 战胜「${enemy.name}」，耗时 ${durationS}s`, timestamp: 0 });
  } else {
    CombatLog.appendLog({ type: 'system', text: `✗ 败于「${enemy.name}」，耗时 ${durationS}s`, timestamp: 0 });
    await showRunEnd(false, `于${enemy.name}之手`, `战斗时长${durationS}s，根基耗尽`);
    runAborted = true;  // 标记死亡，中断 runFlow 后续步骤
    return;
  }

  // 装备掉落（精英/Boss）
  if (enemy.tier !== 'normal' && result.lootRoll > 0.3) {
    const slot: EquipSlot = (['weapon', 'armor', 'ring'] as EquipSlot[])[Math.floor(Math.random() * 3)];
    const equip = rollEquipment(slot, state.stats.luckDrop);
    if (equip) {
      await doLootDecision(equip);
    }
  }

  saveRunSnapshot(state);
  updateUI();
}

// ─── 掉落决策 ────────────────────────────────────────────────────

async function doLootDecision(equip: Equipment): Promise<void> {
  return new Promise(resolve => {
    const current = state.equippedItems[equip.slot] ?? null;
    CombatLog.appendLog({ type: 'loot', text: `获得法宝：${equip.name}（${equip.quality}）`, timestamp: 0 });
    LootUI.showLoot(
      equip, current,
      (e) => { state = equipItem(state, e); updateUI(); resolve(); },
      (_e) => { state = { ...state, inventory: [...state.inventory, _e] }; resolve(); },
      () => { state = { ...state, materials: state.materials + 3 }; resolve(); }
    );
  });
}

// ─── 境界突破（择法）────────────────────────────────────────────

async function doSkillPick(contextLabel: string): Promise<void> {
  CombatLog.appendLog({ type: 'system', text: `━━━ ${contextLabel} ━━━`, timestamp: 0 });
  return new Promise(resolve => {
    SkillPickUI.showSkillPick(state, (node) => {
      const { newState, newSynergies } = pickSkillNode(state, node);
      state = newState;
      CombatLog.appendLog({ type: 'system', text: `修炼「${node.name}」：${node.description}`, timestamp: 0 });
      // 协同触发
      for (const syn of newSynergies) {
        CombatLog.appendLog({ type: 'synergy', text: syn.logText, timestamp: 0 });
        SkillTreeUI.showSynergyToast(syn);
        if (!meta.discoveredSynergies.includes(syn.id)) {
          meta.discoveredSynergies.push(syn.id);
          saveMeta(meta);
        }
      }
      updateUI();
      resolve();
    });
  });
}

// ─── 文字事件 ────────────────────────────────────────────────────

async function doEvent(isFirst = false): Promise<void> {
  const event = isFirst ? getFirstEvent() : getRandomEvent([]);
  CombatLog.appendLog({ type: 'system', text: `━━━ 奇遇：${event.title} ━━━`, timestamp: 0 });
  return new Promise(resolve => {
    EventUI.showEvent(event, (choice: EventChoice) => {
      CombatLog.appendLog({ type: 'system', text: `选择：${choice.label}`, timestamp: 0 });
      CombatLog.appendLog({ type: 'normal', text: choice.rewardText, timestamp: 0 });
      // 应用奖励
      if (choice.rewardType === 'stat_boost') {
        state = { ...state, stats: { ...state.stats, fateDest: state.stats.fateDest + (choice.rewardValue ?? 0) / 100 } };
      } else if (choice.rewardType === 'material') {
        state = { ...state, materials: state.materials + (choice.rewardValue ?? 0) };
      }
      state = { ...state, daoYun: state.daoYun + 2 };
      updateUI();
      resolve();
    });
  });
}

// ─── 天机时刻 ────────────────────────────────────────────────────

async function doHeavenlyMoment(hmId: string): Promise<void> {
  const hm = BOSS_HEAVENLY_MOMENTS.find(h => h.id === hmId);
  if (!hm) return;
  CombatLog.appendLog({ type: 'boss', text: `⚡ 天机时刻：${hm.title}`, timestamp: 0 });
  return new Promise(resolve => {
    HMui.showHeavenlyMoment(hm, state, (opt: HeavenlyMomentOption) => {
      // 应用效果
      applyHMEffect(opt);
      CombatLog.appendLog({ type: 'boss', text: opt.resultText, timestamp: 0 });
      state = { ...state, heavenlyMomentHistory: [...state.heavenlyMomentHistory, `${hm.id}:${opt.effectKey}`] };
      updateUI();
      resolve();
    });
  });
}

function applyHMEffect(opt: HeavenlyMomentOption) {
  const s = { ...state.stats };
  switch (opt.effectKey) {
    case 'hm_openingAggressive':
      s.atk = Math.round(s.atk * (1 + opt.effectValue)); // +25% atk
      s.shield = Math.round(s.shield * 0.5);             // 护盾减半（按数据注释）
      break;
    case 'hm_openingCounterstrike': s.dodge += opt.effectValue; break;   // +15% 闪避
    case 'hm_openingDefend':        s.shield += opt.effectValue; break;  // +80 护盾
    case 'hm_75Defend':
      // effectValue=0.8：最终伤害减至20%，即 dmgReduce 提升到 1-0.2=0.8 上限
      s.dmgReduce = Math.min(0.8, s.dmgReduce + opt.effectValue * 0.5);
      break;
    case 'hm_75Burst':  s.atk = Math.round(s.atk * (1 + opt.effectValue)); break; // +effectValue atk
    case 'hm_75Dodge':  s.dodge += opt.effectValue; break;
    case 'hm_50AcceptDebuff': s.atk = Math.round(s.atk * (1 + opt.effectValue)); break; // +30% 补偿
    case 'hm_50BodySwitch':   s.dmgReduce = Math.min(0.8, s.dmgReduce + opt.effectValue * 0.4); break;
    case 'hm_50Talisman': /* 封印符：抵消阶段变化，无数值效果 */ break;
    case 'hm_25MutualStrike':
      // 对 Boss 造成 effectValue(600%)攻击伤害体现为本段玩家 atk 大幅提升
      s.atk = Math.round(s.atk * opt.effectValue);       // atk ×6 for final segment
      s.hp  = Math.max(1, Math.round(s.hp * 0.75));      // 自身损失 25% 当前 HP
      break;
    case 'hm_25ShieldTank':
      s.shield    += opt.effectValue;                     // +100 护盾（数据值）
      s.dmgReduce  = Math.min(0.8, s.dmgReduce + 0.1);   // Boss 攻击力-30% 等效
      break;
  }
  state = { ...state, stats: s };
}

// ─── Boss 战 ─────────────────────────────────────────────────────

/** Boss 分段战斗（无准备界面，直接结算，不触发装备掉落） */
async function doBossCombatSegment(segEnemy: Enemy, phaseLabel: string): Promise<void> {
  CombatLog.appendLog({ type: 'boss', text: `━━━ ${phaseLabel} ━━━`, timestamp: 0 });
  lockActions();

  const result = calcCombat(state.stats, segEnemy);
  await CombatLog.playLogs(result.logs);

  // 更新状态（Boss 段扣血）
  state = {
    ...state,
    combatCount: state.combatCount + 1,
    stats: {
      ...state.stats,
      hp: Math.max(0, result.playerHpRemain),
      shield: result.playerShieldRemain,
      swordIntent: Math.min(100, (state.stats.swordIntent ?? 0) + result.swordIntentGain),
    },
    daoYun: state.daoYun + 5,
  };

  const durationS = (result.durationMs / 1000).toFixed(1);
  if (result.victory) {
    CombatLog.appendLog({ type: 'boss', text: `苍狼王受挫，耗时 ${durationS}s`, timestamp: 0 });
  } else {
    CombatLog.appendLog({ type: 'system', text: `✗ 败于苍狼王（${phaseLabel}），耗时 ${durationS}s`, timestamp: 0 });
    await showRunEnd(false, `苍狼王·${phaseLabel}`, `战斗时长${durationS}s，根基耗尽`);
    runAborted = true;
    return;
  }

  saveRunSnapshot(state);
  updateUI();
}

async function doBoss(): Promise<void> {
  state = { ...state, currentZone: 2 };
  updateUI();

  CombatLog.appendLog({ type: 'boss', text: '━━━ 最终关卡 · 苍狼王 ━━━', timestamp: 0 });
  CombatLog.appendLog({ type: 'boss', text: '苍狼王自混沌虚空中踏步而来，狼瞳如电，气势滔天。', timestamp: 0 });

  await waitContinue('迎战苍狼王 →');

  // 开场天机时刻（必触发）
  await doHeavenlyMoment('hm_cang_lang_opening');
  if (runAborted) return;

  const segHp = Math.round(BOSS_CANG_LANG.hp / 4); // 每段 8750 HP

  // ── 阶段一：100%→75% ─────────────────────────────────────
  await doBossCombatSegment(
    { ...BOSS_CANG_LANG, hp: segHp },
    '苍狼王 · 阶段一（100%→75%）'
  );
  if (runAborted) return;

  await doHeavenlyMoment('hm_cang_lang_75');
  if (runAborted) return;

  // ── 阶段二：75%→50% ─────────────────────────────────────
  await doBossCombatSegment(
    { ...BOSS_CANG_LANG, hp: segHp },
    '苍狼王 · 阶段二（75%→50%）'
  );
  if (runAborted) return;

  CombatLog.appendLog({ type: 'boss', text: '⚡ 苍狼王发出滔天狼啸，魔化之力涌现——进入化神之怒状态！', timestamp: 0 });
  await doHeavenlyMoment('hm_cang_lang_50');
  if (runAborted) return;

  // ── 阶段三：50%→25%（化神之怒，攻击力+30%，减伤+7%）───────
  await doBossCombatSegment(
    { ...BOSS_CANG_LANG, hp: segHp, atk: Math.round(BOSS_CANG_LANG.atk * 1.3), dmgReduce: 0.22 },
    '苍狼王 · 化神之怒（50%→25%）'
  );
  if (runAborted) return;

  CombatLog.appendLog({ type: 'boss', text: '🐺 苍狼王已至强弩之末，却迸发出殊死之志！', timestamp: 0 });
  await doHeavenlyMoment('hm_cang_lang_25');
  if (runAborted) return;

  // ── 阶段四：25%→0%（垂死反扑，攻击力×1.5，减伤降至 5%）────
  await doBossCombatSegment(
    { ...BOSS_CANG_LANG, hp: segHp, atk: Math.round(BOSS_CANG_LANG.atk * 1.5), dmgReduce: 0.05 },
    '苍狼王 · 垂死反扑（25%→0%）'
  );
  if (runAborted) return;

  // Boss 最终死亡
  CombatLog.appendLog({ type: 'boss', text: '苍狼王轰然倒地，魔气四散——此地从此清明。', timestamp: 0 });
  state = { ...state, daoYun: state.daoYun + 20 };
  const loot = rollEquipment('weapon', state.stats.luckDrop);
  if (loot) await doLootDecision(loot);
}

// ─── 道途分叉 ────────────────────────────────────────────────────

/** Zone1 精英战后的道途二选一 */
async function doZoneFork(): Promise<void> {
  return new Promise(resolve => {
    CombatLog.appendLog({ type: 'system', text: '━━━ 道途分叉 · 幽冥古道入口 ━━━', timestamp: 0 });
    setAction(
      '道途分叉：前方二路',
      '北荒精英已伏，前方道路一分为二。\n气机指引你二择其一——道途将决定后续机缘。',
      [
        {
          label: '⚔ 血战古道（高风险）',
          primary: true,
          onClick: async () => {
            CombatLog.appendLog({ type: 'system', text: '踏入血战古道——战意滔天，根基淬炼更深，但敌患更烈。', timestamp: 0 });
            state = { ...state, stats: { ...state.stats, atk: Math.round(state.stats.atk * 1.08) }, daoYun: state.daoYun + 3 };
            updateUI();
            await waitContinue('深入古道 →');
            resolve();
          },
        },
        {
          label: '🌿 幽谷秘境（稳健）',
          onClick: async () => {
            CombatLog.appendLog({ type: 'system', text: '踏入幽谷秘境——灵气充沛，根基壮实，境界机缘更丰。', timestamp: 0 });
            const newMaxHp = state.stats.maxHp + 200;
            state = { ...state, stats: { ...state.stats, maxHp: newMaxHp, hp: Math.min(state.stats.hp + 200, newMaxHp) }, daoYun: state.daoYun + 3 };
            updateUI();
            await waitContinue('深入秘境 →');
            resolve();
          },
        },
      ]
    );
  });
}

// ─── Run 结算 ─────────────────────────────────────────────────────

async function showRunEnd(victory: boolean, blameContext: string, blameDetail: string): Promise<void> {
  const el = document.getElementById('run-end')!;
  document.getElementById('re-title')!.textContent = victory ? '道成圆满 · 一局功成' : '历劫封印 · 此番折戟';
  document.getElementById('re-quote')!.textContent = victory
    ? '剑指天道，一步一个脚印，终成正果。'
    : `死于「${blameContext}」——${blameDetail}。`;

  // 精确归因
  const blame = victory
    ? '恭喜完成本局！'
    : `精确归因：此局失败的关键节点是「${blameContext}」，${blameDetail}。\n天机时刻选择：${state.heavenlyMomentHistory.join(' → ') || '（无）'}`;
  document.getElementById('re-blame')!.textContent = blame;

  // Build 摘要
  document.getElementById('re-build')!.innerHTML =
    `灵根：${state.spiritRoot} · 修炼功法：${state.skillTree.map(n => n.name).join('、') || '无'}\n` +
    `战斗次数：${state.combatCount} · 道韵积累：${state.daoYun}`;

  // 协同摘要
  document.getElementById('re-synergies')!.textContent =
    state.activeSynergies.length > 0
      ? state.activeSynergies.map(s => `${s.name}：${s.logText}`).join('\n')
      : '此局未触发任何天机感应';

  // 存档结算
  finalizeRun(state, victory);
  meta = loadMeta(); // 重新加载以获取 finalizeRun 写入的数据

  el.classList.add('active');
}

// ─── Run 主流程 ──────────────────────────────────────────────────

async function runFlow() {
  CombatLog.clearLogs();
  updateUI();

  // ── Zone 1：北荒边境 ──────────────────────────────────────
  state = { ...state, currentZone: 0 };
  CombatLog.appendLog({ type: 'system', text: '═══ 踏入北荒边境 ═══', timestamp: 0 });
  setAction('北荒边境', '荒野之中，危机四伏。凛冽的北风携着血腥气息袭来，前路漫漫。', []);
  await waitContinue('踏入北荒 →');

  await doCombat(ZONE1_ENEMIES[0]);  // 普通1
  if (runAborted) return;
  await doCombat(ZONE1_ENEMIES[1]);  // 普通2
  if (runAborted) return;
  await doEvent(true);               // 事件（底线保障：首次必good/medium）
  await doCombat(ZONE1_ENEMIES[2]);  // 普通3
  if (runAborted) return;
  await doSkillPick('第一次境界突破');
  await doCombat(ZONE1_ENEMIES[3]);  // 精英
  if (runAborted) return;
  await doSkillPick('第二次境界突破');  // 精英战后多一次境界突破
  await doZoneFork();                // 道途分叉

  // ── Zone 2：幽冥古道 ──────────────────────────────────────
  state = { ...state, currentZone: 1 };
  CombatLog.appendLog({ type: 'system', text: '═══ 踏入幽冥古道 ═══', timestamp: 0 });
  setAction('幽冥古道', '古道幽深，鬼气森森，这里是修魔者的墓场。你感到一股莫名的危机。', []);
  await waitContinue('深入古道 →');

  await doCombat(ZONE2_ENEMIES[0]);  // 普通4
  if (runAborted) return;
  await doEvent();                    // 事件
  await doCombat(ZONE2_ENEMIES[1]);  // 普通5
  if (runAborted) return;
  await doSkillPick('第三次境界突破');
  await doCombat(ZONE2_ENEMIES[2]);  // 普通6
  if (runAborted) return;
  await doSkillPick('第四次境界突破');  // 普通6后多一次境界突破
  await doCombat(ZONE2_ENEMIES[3]);  // 精英
  if (runAborted) return;
  await doSkillPick('第五次境界突破');  // Zone2 精英后境界突破

  // ── Boss 战 ───────────────────────────────────────────────
  await doBoss();

  // 若执行到这里说明胜利（doCombat中defeat会中断流程）
  await showRunEnd(true, '', '');
}

// ─── 全局导出（供 HTML onclick 调用）───────────────────────────

declare global { interface Window { Game: typeof Game; } }

const Game = {
  selectSpiritRoot: async (spiritRoot: SpiritRoot) => {
    document.getElementById('spirit-select')!.style.display = 'none';
    document.getElementById('app')!.style.removeProperty('display');
    runAborted = false;  // 重置死亡标志
    state = createNewRun(spiritRoot);
    meta = loadMeta();
    await runFlow();
  },
  // 掉落决策按钮（由 loot.ts 内部调用，但也挂在 Game 对象供 HTML 内联调用）
  equipLoot:   LootUI.equipLoot,
  storeLoot:   LootUI.storeLoot,
  discardLoot: LootUI.discardLoot,

  restartRun: () => {
    runAborted = false;
    document.getElementById('run-end')!.classList.remove('active');
    document.getElementById('spirit-select')!.style.removeProperty('display');
  },
  exportSave: () => {
    const code = exportSaveCode();
    navigator.clipboard?.writeText(code).then(
      () => alert('存档码已复制到剪贴板！'),
      () => alert(`存档码：\n${code}`)
    );
  },
};

window.Game = Game;
