// ============================================================
//  装备与词缀数据（Day 6）
//  Phase 0：3槽，15个词缀（5基础 + 7触发 + 3协同）
// ============================================================

import type { Affix, Equipment, EquipSlot, ItemQuality } from '../types';

// ── 词缀定义 ──────────────────────────────────────────────

export const AFFIXES_PHASE0: Affix[] = [

  // ── 基础词缀（5个，任何品质可出现）──────────────────────
  {
    id: 'af_sharp',
    name: '锋利',
    tier: 'basic',
    description: '攻击力 +{v}',
    synergyTags: ['atk'],
    synergyCount: 0,
    effectKey: 'affix_atk',
    effectValue: 25,
  },
  {
    id: 'af_tough',
    name: '强韧',
    tier: 'basic',
    description: '最大生命 +{v}',
    synergyTags: ['hp'],
    synergyCount: 0,
    effectKey: 'affix_maxHp',
    effectValue: 80,
  },
  {
    id: 'af_swift',
    name: '神速',
    tier: 'basic',
    description: '攻速 +{v}%',
    synergyTags: ['atkSpeed'],
    synergyCount: 0,
    effectKey: 'affix_atkSpeed',
    effectValue: 8,
  },
  {
    id: 'af_keen',
    name: '敏锐',
    tier: 'basic',
    description: '暴击率 +{v}%',
    synergyTags: ['crit'],
    synergyCount: 1,
    effectKey: 'affix_critRate',
    effectValue: 5,
  },
  {
    id: 'af_sturdy',
    name: '坚固',
    tier: 'basic',
    description: '减伤率 +{v}%',
    synergyTags: ['dmgReduce'],
    synergyCount: 0,
    effectKey: 'affix_dmgReduce',
    effectValue: 4,
  },

  // ── 触发词缀（7个，珍品以上出现）──────────────────────────
  {
    id: 'af_bloodthirst',
    name: '嗜血',
    tier: 'trigger',
    description: '击杀时回复最大生命 {v}%',
    synergyTags: ['lifesteal', 'kill'],
    synergyCount: 0,
    effectKey: 'affix_onKillHeal',
    effectValue: 3,
  },
  {
    id: 'af_cold_snap',
    name: '寒气侵体',
    tier: 'trigger',
    description: '命中时有20%概率减速敌人3秒，减速状态下暴击率额外+{v}%',
    synergyTags: ['debuff', 'crit', 'conditional'],
    synergyCount: 1,
    effectKey: 'affix_coldSnap',
    effectValue: 8,
  },
  {
    id: 'af_blood_blade',
    name: '以血饲剑',
    tier: 'trigger',
    description: '生命低于30%时攻击力 +{v}%',
    synergyTags: ['lowHp', 'atk'],
    synergyCount: 1,
    effectKey: 'affix_lowHpAtkBoost',
    effectValue: 30,
  },
  {
    id: 'af_thunder',
    name: '雷引',
    tier: 'trigger',
    description: '攻击时有{v}%概率附带雷击（额外40%伤害）',
    synergyTags: ['proc', 'burst'],
    synergyCount: 0,
    effectKey: 'affix_thunderProc',
    effectValue: 15,
  },
  {
    id: 'af_shield_break',
    name: '破盾',
    tier: 'trigger',
    description: '攻击有护盾的敌人时额外造成{v}%伤害',
    synergyTags: ['penetrate', 'atk'],
    synergyCount: 0,
    effectKey: 'affix_shieldBreak',
    effectValue: 25,
  },
  {
    id: 'af_berserker',
    name: '狂战',
    tier: 'trigger',
    description: '每损失10%最大生命，攻速+{v}%（最多叠加5层）',
    synergyTags: ['lowHp', 'atkSpeed'],
    synergyCount: 0,
    effectKey: 'affix_berserker',
    effectValue: 4,
  },
  {
    id: 'af_lucky_drop',
    name: '鸿运',
    tier: 'trigger',
    description: '掉落幸运 +{v}%',
    synergyTags: ['luck', 'loot'],
    synergyCount: 0,
    effectKey: 'affix_luckDrop',
    effectValue: 12,
  },

  // ── 协同词缀（3个，极品以上出现）──────────────────────────
  {
    id: 'af_sword_intent_surge',
    name: '剑意涌现',
    tier: 'synergy',
    description: '每20层剑意，攻击力 +{v}（上限5层）',
    synergyTags: ['swordIntent', 'atk', 'accumulate'],
    synergyCount: 2,
    effectKey: 'affix_swordIntentSurge',
    effectValue: 8,
  },
  {
    id: 'af_true_qi_active',
    name: '金刚护体·主动',
    tier: 'synergy',
    description: '激活主动技能时获得最大生命{v}%的护盾',
    synergyTags: ['shield', 'active', 'body'],
    synergyCount: 2,
    effectKey: 'affix_trueQiOnActive',
    effectValue: 15,
  },
  {
    id: 'af_void_combo',
    name: '虚实连击',
    tier: 'synergy',
    description: '条件触发类技能激活后，下一次攻击暴击率+{v}%',
    synergyTags: ['conditional', 'crit', 'burst'],
    synergyCount: 2,
    effectKey: 'affix_voidCombo',
    effectValue: 20,
  },
];

// ── 品质掉落权重 ──────────────────────────────────────────

const QUALITY_WEIGHTS: Record<ItemQuality, number> = {
  mortal:    40, // 凡品
  spirit:    30, // 灵品
  rare:      18, // 珍品
  supreme:    9, // 极品
  immortal:   3, // 仙品
};

// ── 词缀池（按品质筛选可用词缀）─────────────────────────────

function getAvailableAffixes(quality: ItemQuality): Affix[] {
  const tierLimit: Affix['tier'][] = ['basic'];
  if (quality === 'rare' || quality === 'supreme' || quality === 'immortal') {
    tierLimit.push('trigger');
  }
  if (quality === 'supreme' || quality === 'immortal') {
    tierLimit.push('synergy');
  }
  return AFFIXES_PHASE0.filter(a => tierLimit.includes(a.tier));
}

function getAffixCount(quality: ItemQuality): number {
  return { mortal: 0, spirit: 1, rare: 2, supreme: 3, immortal: 4 }[quality];
}

// ── 掉落装备生成 ─────────────────────────────────────────

let instanceCounter = 0;

export function rollEquipment(slot: EquipSlot, luckBonus = 0): Equipment | null {
  // 凡品提升幸运降低出现率
  const weights = { ...QUALITY_WEIGHTS };
  if (luckBonus > 0) {
    // 幸运值每+10%，凡品权重-5，灵品+2，珍品+2，极品+1
    const luck = Math.min(luckBonus, 1);
    weights.mortal = Math.max(10, weights.mortal - Math.floor(luck * 50));
    weights.spirit += Math.floor(luck * 20);
    weights.rare += Math.floor(luck * 20);
    weights.supreme += Math.floor(luck * 10);
  }

  // 加权随机品质
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let quality: ItemQuality = 'mortal';
  for (const [q, w] of Object.entries(weights) as [ItemQuality, number][]) {
    rand -= w;
    if (rand <= 0) { quality = q; break; }
  }

  // 凡品不生成装备对象（直接过滤）
  if (quality === 'mortal') return null;

  const affixCount = getAffixCount(quality);
  const pool = getAvailableAffixes(quality);
  const chosenAffixes: Affix[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < affixCount && pool.length > 0; i++) {
    const available = pool.filter(a => !usedIds.has(a.id));
    if (available.length === 0) break;
    const picked = available[Math.floor(Math.random() * available.length)];
    chosenAffixes.push(picked);
    usedIds.add(picked.id);
  }

  const qualityNames: Record<ItemQuality, string> = {
    mortal: '凡品', spirit: '灵品', rare: '珍品',
    supreme: '极品', immortal: '仙品',
  };
  const slotNames: Record<EquipSlot, string> = {
    weapon: '法剑', armor: '法袍', ring: '玉戒',
  };

  return {
    id: `equip_${slot}_${quality}`,
    instanceId: `inst_${++instanceCounter}_${Date.now()}`,
    slot,
    quality,
    name: `${qualityNames[quality]}·${slotNames[slot]}`,
    affixes: chosenAffixes,
  };
}

// ── 从装备中收集协同标签 ─────────────────────────────────

export function collectAffixTags(items: Equipment[]): string[] {
  const tags: string[] = [];
  for (const item of items) {
    for (const affix of item.affixes) {
      for (const tag of affix.synergyTags) {
        if (!tags.includes(tag)) tags.push(tag);
      }
    }
  }
  return tags;
}
