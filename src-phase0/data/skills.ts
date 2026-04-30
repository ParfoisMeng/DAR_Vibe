// ============================================================
//  功法节点数据（Day 3 准备）
//  Phase 0：20个节点（10剑系 + 10通用）
// ============================================================

import type { SkillNode } from '../types';

// ── 剑系功法节点（10个）────────────────────────────────────

export const SWORD_SKILLS: SkillNode[] = [
  // 被动增益
  {
    id: 'sk_sword_intent',
    name: '剑意积累',
    type: 'passive',
    spiritRoot: 'sword',
    description: '每次攻击叠加1~3层剑意（上限100层），剑意每20层提升暴击率+5%',
    flavorText: '意随心动，剑随意走',
    synergyTags: ['swordIntent', 'accumulate'],
    synergyCount: 3,
    effectKey: 'passive_swordIntentAccumulate',
    effectValue: 1,
  },
  {
    id: 'sk_sword_release',
    name: '剑意外放',
    type: 'conditional',
    spiritRoot: 'sword',
    description: '剑意达到80层时，下一次攻击伤害+60%，消耗30层剑意',
    flavorText: '积意成势，一击破虚',
    synergyTags: ['swordIntent', 'burst'],
    synergyCount: 2,
    effectKey: 'conditional_swordIntentBurst',
    effectValue: 0.6,
  },
  {
    id: 'sk_sword_dance',
    name: '御剑飞舞',
    type: 'passive',
    spiritRoot: 'sword',
    description: '攻速+15%，每次攻击后有20%概率额外刺出一剑（造成50%伤害）',
    flavorText: '剑如游龙，虚实难辨',
    synergyTags: ['atkSpeed', 'multistrike'],
    synergyCount: 1,
    effectKey: 'passive_swordDance',
    effectValue: 0.15,
  },
  {
    id: 'sk_sword_heart',
    name: '剑心通明',
    type: 'passive',
    spiritRoot: 'sword',
    description: '暴击率+10%，暴击时剑意额外+3层',
    flavorText: '心明则剑利，神凝则意强',
    synergyTags: ['crit', 'swordIntent'],
    synergyCount: 2,
    effectKey: 'passive_swordHeart',
    effectValue: 0.10,
  },
  {
    id: 'sk_sword_qi',
    name: '纯阳剑气',
    type: 'passive',
    spiritRoot: 'sword',
    description: '攻击力+20%，剑气伤害无视敌方10%减伤',
    flavorText: '阳极生阴，刚中含柔',
    synergyTags: ['atk', 'penetrate'],
    synergyCount: 1,
    effectKey: 'passive_pureYangQi',
    effectValue: 0.20,
  },
  // 主动技能
  {
    id: 'sk_slash_soul',
    name: '斩魄剑',
    type: 'active',
    spiritRoot: 'sword',
    description: '主动释放：造成350%攻击伤害，无视护盾，冷却90秒',
    flavorText: '此剑出鞘，魂魄难留',
    synergyTags: ['active', 'burst'],
    synergyCount: 1,
    effectKey: 'active_slashSoul',
    effectValue: 3.5,
  },
  {
    id: 'sk_void_strike',
    name: '趁虚而入',
    type: 'conditional',
    spiritRoot: 'sword',
    description: '攻击减速状态下的敌人时，伤害+40%',
    flavorText: '借力打力，以虚击实',
    synergyTags: ['conditional', 'debuff', 'swordIntent'],
    synergyCount: 2,
    effectKey: 'conditional_voidStrike',
    effectValue: 0.40,
  },
  {
    id: 'sk_sword_will',
    name: '剑道意志',
    type: 'passive',
    spiritRoot: 'sword',
    description: '剑意不会因Boss阶段变化而消散，受到削弱效果时反而+10层剑意',
    flavorText: '道心坚固，外物难移',
    synergyTags: ['swordIntent', 'resilience'],
    synergyCount: 1,
    effectKey: 'passive_swordWill',
    effectValue: 10,
  },
  {
    id: 'sk_heaven_step',
    name: '凌空踏虚',
    type: 'passive',
    spiritRoot: 'sword',
    description: '闪避率+8%，闪避成功时下一次攻击暴击率+25%',
    flavorText: '虚实之间，自有天地',
    synergyTags: ['dodge', 'crit', 'burst'],
    synergyCount: 1,
    effectKey: 'passive_heavenStep',
    effectValue: 0.08,
  },
  {
    id: 'sk_true_sword',
    name: '真剑无形',
    type: 'passive',
    spiritRoot: 'sword',
    description: '剑意达到50层时，攻击力额外+25%（持续，直至剑意降至50层以下）',
    flavorText: '有形之剑不及无形，有道之剑无坚不摧',
    synergyTags: ['swordIntent', 'atk', 'threshold'],
    synergyCount: 2,
    effectKey: 'passive_trueSword',
    effectValue: 0.25,
  },
];

// ── 通用功法节点（10个）──────────────────────────────────

export const UNIVERSAL_SKILLS: SkillNode[] = [
  {
    id: 'sk_iron_body',
    name: '金刚体魄',
    type: 'passive',
    spiritRoot: 'universal',
    description: '最大生命+20%，受到伤害时有15%概率护体真气全抵',
    flavorText: '身如金刚，心如磐石',
    synergyTags: ['hp', 'shield', 'body'],
    synergyCount: 1,
    effectKey: 'passive_ironBody',
    effectValue: 0.20,
  },
  {
    id: 'sk_fortune',
    name: '鸿运当头',
    type: 'passive',
    spiritRoot: 'universal',
    description: '掉落幸运+20%，战斗结束后有额外10%概率获得一件装备',
    flavorText: '运势如潮，顺势而为',
    synergyTags: ['luck', 'loot'],
    synergyCount: 0,
    effectKey: 'passive_fortune',
    effectValue: 0.20,
  },
  {
    id: 'sk_blood_thirst',
    name: '嗜血之性',
    type: 'conditional',
    spiritRoot: 'universal',
    description: '每次击杀敌人回复最大生命的3%，击杀精英怪回复10%',
    flavorText: '血腥之气，反能激发潜力',
    synergyTags: ['lifesteal', 'kill'],
    synergyCount: 0,
    effectKey: 'conditional_bloodThirst',
    effectValue: 0.03,
  },
  {
    id: 'sk_dao_sense',
    name: '天道感知',
    type: 'passive',
    spiritRoot: 'universal',
    description: '天命值+15，增加稀有文字事件和稀有掉落的概率',
    flavorText: '感天道之流转，知命数之变迁',
    synergyTags: ['fate', 'event'],
    synergyCount: 0,
    effectKey: 'passive_daoSense',
    effectValue: 15,
  },
  {
    id: 'sk_swift_steps',
    name: '轻身步法',
    type: 'passive',
    spiritRoot: 'universal',
    description: '闪避率+5%，攻速+8%',
    flavorText: '身轻如燕，如风入林',
    synergyTags: ['dodge', 'atkSpeed'],
    synergyCount: 1,
    effectKey: 'passive_swiftSteps',
    effectValue: 0.05,
  },
  {
    id: 'sk_focused_strike',
    name: '蓄势待发',
    type: 'conditional',
    spiritRoot: 'universal',
    description: '战斗开始时攻击力+30%，持续15秒（首轮爆发）',
    flavorText: '蓄而后发，一鸣惊人',
    synergyTags: ['burst', 'opening'],
    synergyCount: 0,
    effectKey: 'conditional_focusedStrike',
    effectValue: 0.30,
  },
  {
    id: 'sk_material_eye',
    name: '识宝慧眼',
    type: 'passive',
    spiritRoot: 'universal',
    description: '掉落幸运+15%，装备词缀出现协同类词缀的概率+10%',
    flavorText: '慧眼如炬，宝物难藏',
    synergyTags: ['luck', 'affix'],
    synergyCount: 0,
    effectKey: 'passive_materialEye',
    effectValue: 0.15,
  },
  {
    id: 'sk_endurance',
    name: '百折不挠',
    type: 'passive',
    spiritRoot: 'universal',
    description: '根基低于30%时，攻击力+20%，减伤率+10%',
    flavorText: '置之死地而后生，困境激发潜力',
    synergyTags: ['lowHp', 'atk'],
    synergyCount: 1,
    effectKey: 'passive_endurance',
    effectValue: 0.20,
  },
  {
    id: 'sk_true_qi_shield',
    name: '护体真气',
    type: 'active',
    spiritRoot: 'universal',
    description: '主动激活：获得相当于最大生命30%的护盾，冷却60秒',
    flavorText: '真气外溢，护体如铠',
    synergyTags: ['shield', 'active', 'body'],
    synergyCount: 1,
    effectKey: 'active_trueQiShield',
    effectValue: 0.30,
  },
  {
    id: 'sk_dao_heart',
    name: '道心不灭',
    type: 'passive',
    spiritRoot: 'universal',
    description: '每次境界突破后，所有属性额外+3%（叠加，最多6次）',
    flavorText: '道心愈坚，境界愈明',
    synergyTags: ['stat', 'accumulate'],
    synergyCount: 0,
    effectKey: 'passive_daoHeart',
    effectValue: 0.03,
  },
];

// ── 完整节点池（Phase 0 = 20个）────────────────────────────

export const ALL_SKILLS_PHASE0: SkillNode[] = [
  ...SWORD_SKILLS,
  ...UNIVERSAL_SKILLS,
];

// ── 节点池权重随机（60%剑系 + 40%通用）────────────────────

export function drawSkillCandidates(
  count: number,
  spiritRoot: 'sword' | 'body' | 'tao' | 'fire' | 'ice',
  existingIds: string[],
): SkillNode[] {
  const available = ALL_SKILLS_PHASE0.filter(s => !existingIds.includes(s.id));
  if (available.length <= count) return available;

  const swordPool = available.filter(s => s.spiritRoot === spiritRoot);
  const universalPool = available.filter(s => s.spiritRoot === 'universal');

  const results: SkillNode[] = [];
  const picked = new Set<string>();

  // 60%概率先从同系节点选，40%从通用选
  for (let i = 0; i < count; i++) {
    const useSword = Math.random() < 0.6 && swordPool.length > 0;
    const pool = useSword ? swordPool : universalPool;
    const eligible = pool.filter(s => !picked.has(s.id));

    if (eligible.length === 0) {
      // 当前池空了，从另一个池选
      const fallback = (useSword ? universalPool : swordPool).filter(s => !picked.has(s.id));
      if (fallback.length > 0) {
        const choice = fallback[Math.floor(Math.random() * fallback.length)];
        results.push(choice);
        picked.add(choice.id);
      }
    } else {
      const choice = eligible[Math.floor(Math.random() * eligible.length)];
      results.push(choice);
      picked.add(choice.id);
    }
  }

  return results;
}

// ── 底线保障：第2次境界节点必须含≥1个有协同潜力的节点 ────────

export function ensureSynergyCandidateIfNeeded(
  candidates: SkillNode[],
  skillPickCount: number, // 这是第几次选择（0-based）
  existingIds: string[],
): SkillNode[] {
  // 第2次（index=1）及以后应用底线保障
  if (skillPickCount < 1) return candidates;

  const hasSynergy = candidates.some(s => s.synergyCount >= 1);
  if (hasSynergy) return candidates;

  // 替换一个无协同节点为有协同节点
  const synergyNodes = ALL_SKILLS_PHASE0.filter(
    s => s.synergyCount >= 1 && !existingIds.includes(s.id) && !candidates.find(c => c.id === s.id)
  );
  if (synergyNodes.length === 0) return candidates; // 无可替换，放弃保障

  const replacement = synergyNodes[Math.floor(Math.random() * synergyNodes.length)];
  // 替换第一个无协同节点
  const idx = candidates.findIndex(s => s.synergyCount === 0);
  if (idx >= 0) {
    const newCandidates = [...candidates];
    newCandidates[idx] = replacement;
    return newCandidates;
  }
  return candidates;
}
