// ============================================================
//  协同效果数据（Day 4）
//  Phase 0：5个协同（3普通A型 + 1稀有 + 1史诗）
//  ⚠️ 所有 logText 必须通过仙侠叙事语言规范（禁止机制描述词汇）
// ============================================================

import type { Synergy } from '../types';

export const SYNERGIES_PHASE0: Synergy[] = [

  // ── 普通协同 A 型（单节点触发）────────────────────────────

  {
    id: 'syn_intent_void',
    name: '剑意入虚',
    tier: 'commonA',
    requiredTag: 'swordIntent',
    enhanceTag: 'conditional',
    baseEffectKey: 'syn_swordIntentAccumRate',
    baseEffectValue: 0.50, // 剑意积累速度+50%
    enhancedEffectKey: 'syn_voidStrikeSynergyBonus',
    enhancedEffectValue: 0.30, // 「趁虚而入」额外+30%
    // ✅ 仙侠叙事语言，无机制描述词汇
    logText: '【天机感应·普通】剑意与虚空相合，动中有静，招招皆是道',
    journalName: '剑意入虚',
    journalDesc: '持「剑意积累」者，感悟虚空之道，剑意积累速度大增；若同时持「趁虚而入」，更能以虚击实，威力倍出。',
  },

  {
    id: 'syn_crit_accumulate',
    name: '心剑合一',
    tier: 'commonA',
    requiredTag: 'crit',
    enhanceTag: 'swordIntent',
    baseEffectKey: 'syn_critGainSwordIntent',
    baseEffectValue: 3, // 暴击时剑意+3（叠加在基础值上）
    enhancedEffectKey: 'syn_critRateFromSwordIntent',
    enhancedEffectValue: 0.001, // 每层剑意暴击率+0.1%
    logText: '【天机感应·普通】心与剑合，意与道通，每一次会心，皆是天意流转',
    journalName: '心剑合一',
    journalDesc: '持「暴击」相关功法者，每次会心之击皆能积累剑意；若同时修炼剑意之法，剑意亦反哺会心之力，相辅相成。',
  },

  {
    id: 'syn_burst_momentum',
    name: '势如破竹',
    tier: 'commonA',
    requiredTag: 'burst',
    enhanceTag: 'accumulate',
    baseEffectKey: 'syn_burstCooldownReduce',
    baseEffectValue: 0.20, // 爆发类技能冷却-20%
    enhancedEffectKey: 'syn_accumulateBurstDmg',
    enhancedEffectValue: 0.25, // 积累类节点触发时爆发伤害+25%
    logText: '【天机感应·普通】势若奔雷，蓄而必发，积势之道，摧枯拉朽',
    journalName: '势如破竹',
    journalDesc: '持爆发类功法者，蓄势之力令爆发间隔缩短；若同时持积累类功法，每次蓄满爆发，威力更甚。',
  },

  // ── 稀有协同（双节点）────────────────────────────────────

  {
    id: 'syn_sword_void_master',
    name: '剑道宗师',
    tier: 'rare',
    requiredTags: ['swordIntent', 'conditional'],
    baseEffectKey: 'syn_swordVoidMaster',
    baseEffectValue: 2, // 剑意积累速度×2，同时「趁虚而入」触发条件的伤害加成×1.5
    logText: '【天机触发·稀有】剑道与虚空贯通，意动则天地响应——此局，已踏入剑道宗师之境',
    journalName: '剑道宗师',
    journalDesc: '同时持「剑意积累」系功法与「趁虚而入」，两道之间因果相合，剑意积累翻倍，趁虚之击威力骤增一半。这是剑道修炼中最难得的化境之道。',
  },

  // ── 史诗协同（多节点+灵根限制）──────────────────────────

  {
    id: 'syn_pure_yang_ascend',
    name: '纯阳化道',
    tier: 'epic',
    requiredTags: ['swordIntent', 'atk', 'accumulate'],
    baseEffectKey: 'syn_pureYangAscend',
    baseEffectValue: 0, // 特殊效果：见 effectKey 实现
    // 特殊效果：剑意每积累10层，攻击力+3%（叠加，上限+30%）；
    //           剑意满100层时触发「纯阳天雷」，全场造成500%攻击力伤害（本战1次）
    logText: '【天命降临·史诗】天道震颤，纯阳之气化为无形剑道——此刻，你已非寻常修士，而是天地间一柄行走的利剑',
    journalName: '纯阳化道',
    journalDesc: '集剑意、攻势、积累三法于一身，纯阳之气升华为道，剑意每积满便强化攻势，待剑意臻于化境，一声天雷，横扫万敌。此乃剑道最高境界，千局难遇一次。',
  },
];

// ── 协同检测函数 ─────────────────────────────────────────

export function detectSynergies(skillTreeTags: string[]): Synergy[] {
  const tagSet = new Set(skillTreeTags);
  const active: Synergy[] = [];

  for (const syn of SYNERGIES_PHASE0) {
    if (syn.tier === 'commonA' || syn.tier === 'rare' || syn.tier === 'epic') {
      if (syn.requiredTags) {
        // B型/稀有/史诗：所有标签都必须存在
        if (syn.requiredTags.every(t => tagSet.has(t))) {
          active.push(syn);
        }
      } else if (syn.requiredTag) {
        // A型：必要标签存在即触发
        if (tagSet.has(syn.requiredTag)) {
          active.push(syn);
        }
      }
    }
  }

  return active;
}

// ── 获取功法树中所有标签 ──────────────────────────────────

export function collectSkillTags(skillTree: import('../types').SkillNode[]): string[] {
  const tags: string[] = [];
  for (const skill of skillTree) {
    for (const tag of skill.synergyTags) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  return tags;
}

// ── 检测新增协同（用于触发通知）──────────────────────────

export function findNewSynergies(
  oldSynergies: Synergy[],
  newSynergies: Synergy[],
): Synergy[] {
  const oldIds = new Set(oldSynergies.map(s => s.id));
  return newSynergies.filter(s => !oldIds.has(s.id));
}
