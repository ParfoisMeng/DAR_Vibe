// ============================================================
//  文字事件数据（Day 10 准备）
//  Phase 0：5个事件（保证第一个事件是 tier:'good' 或 'medium'）
// ============================================================

import type { GameEvent } from '../types';

export const EVENTS_PHASE0: GameEvent[] = [

  // ── 中等收益事件（底线保障：可作为第一个事件）─────────────
  {
    id: 'ev_ancient_tablet',
    tier: 'medium',
    title: '古修遗迹',
    description: '荒野中，你发现一处被荒草掩埋的石台。\n台上刻有残缺的功法，灵气稀薄但仍可感悟。',
    choices: [
      {
        label: '坐下感悟',
        description: '沉入冥想，试图捕捉残留的道意',
        rewardType: 'skill_shard',
        rewardValue: 1,
        rewardText: '你从残缺的铭文中领悟到一丝道意，获得功法碎片×1。',
      },
      {
        label: '带走石台',
        description: '将石台碎片收入储物袋',
        rewardType: 'material',
        rewardValue: 5,
        rewardText: '石台虽然古旧，其中蕴含的灵材仍有价值，获得炼化材料×5。',
      },
      {
        label: '不感兴趣',
        description: '继续前行',
        rewardType: 'nothing',
        rewardText: '你转身离开，继续前行。',
      },
    ],
  },

  // ── 良好收益事件 ──────────────────────────────────────────
  {
    id: 'ev_lost_cultivator',
    tier: 'good',
    title: '迷途修士',
    description: '你在路旁发现一名身受重伤的修士，神志尚清醒。\n他似乎曾经历了一场恶战，随身携带的储物袋还完好。',
    choices: [
      {
        label: '出手救治',
        description: '消耗真气为其疗伤',
        rewardType: 'material',
        rewardValue: 8,
        rewardText: '修士苏醒后感激不已，将随身灵材悉数相赠，获得炼化材料×8。',
      },
      {
        label: '询问道路',
        description: '借机了解前方险情',
        rewardType: 'stat_boost',
        rewardValue: 10,
        rewardText: '修士描述了前方的危险所在，你对地形了如指掌，天命值+10。',
      },
      {
        label: '继续赶路',
        description: '他人之事，不便插手',
        rewardType: 'nothing',
        rewardText: '你加快脚步，远离此地。',
      },
    ],
  },

  // ── 中等收益事件 ──────────────────────────────────────────
  {
    id: 'ev_treasure_chest',
    tier: 'medium',
    title: '封印宝箱',
    description: '你在一处岩壁缝隙中发现一口古旧的铁箱，\n上面的封印符文已经残破，内有物品散发微弱灵气。',
    choices: [
      {
        label: '强行破开',
        description: '直接以剑气粉碎封印',
        rewardType: 'loot' as any,
        rewardValue: 1,
        rewardText: '封印爆裂，宝箱中的法宝飞出——你获得了一件装备！',
      },
      {
        label: '仔细研究封印',
        description: '耗时破解，但保留所有内容物',
        rewardType: 'material',
        rewardValue: 10,
        rewardText: '你花费一刻钟研究封印，完整取出宝箱，获得炼化材料×10。',
      },
    ],
  },

  // ── 风险事件 ──────────────────────────────────────────────
  {
    id: 'ev_strange_fruit',
    tier: 'medium',
    title: '异果奇遇',
    description: '你发现一株奇异的灵果树，果实散发诱人灵气。\n但这种灵果你从未见过，不知其效。',
    choices: [
      {
        label: '直接服用',
        description: '以修为消化未知灵果',
        rewardType: 'stat_boost',
        rewardValue: 30,
        rewardText: '灵果入口，一股热流在体内激荡——最大生命+30，但略感不适，减伤-2%。',
      },
      {
        label: '带走备用',
        description: '留作后续炼化之用',
        rewardType: 'material',
        rewardValue: 6,
        rewardText: '灵果虽不知其效，炼化为材料应有价值，获得炼化材料×6。',
      },
      {
        label: '不予理会',
        description: '来历不明，不可轻动',
        rewardType: 'nothing',
        rewardText: '你谨慎地绕道而行。',
      },
    ],
  },

  // ── 文字质感事件（无实质收益，强化代入感）──────────────────
  {
    id: 'ev_dao_revelation',
    tier: 'neutral',
    title: '道意感悟',
    description: '夜行途中，天地骤然寂静，你感到一丝玄妙的道意在心中流转。\n此乃可遇不可求的顿悟之机——',
    choices: [
      {
        label: '闭目感悟',
        description: '停下脚步，静心凝神',
        rewardType: 'stat_boost',
        rewardValue: 5,
        rewardText: '道意在心中凝固，境界愈加稳固，天命值+5。',
      },
      {
        label: '边走边悟',
        description: '不停脚步，以行悟道',
        rewardType: 'stat_boost',
        rewardValue: 3,
        rewardText: '动中求悟，难以深入，仍有所得，天命值+3。',
      },
    ],
  },
];

// ── 事件池工具函数 ────────────────────────────────────────

export function getFirstEvent(): GameEvent {
  // 底线保障：第一个事件必须是 good 或 medium
  const goodEvents = EVENTS_PHASE0.filter(e => e.tier === 'good' || e.tier === 'medium');
  return goodEvents[Math.floor(Math.random() * goodEvents.length)];
}

export function getRandomEvent(excludeIds: string[] = []): GameEvent {
  const pool = EVENTS_PHASE0.filter(e => !excludeIds.includes(e.id));
  if (pool.length === 0) return EVENTS_PHASE0[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
