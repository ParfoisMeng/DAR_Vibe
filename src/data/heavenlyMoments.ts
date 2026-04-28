// ============================================================
//  天机时刻数据（Day 8）
//  苍狼王 Boss 战：开场 + 75% + 25%
// ============================================================

import type { HeavenlyMoment } from '../types';

export const BOSS_HEAVENLY_MOMENTS: HeavenlyMoment[] = [

  // ── 开场天机时刻（必触发，无论Build强弱）───────────────────
  {
    id: 'hm_cang_lang_opening',
    triggerType: 'opening',
    title: '天机时刻 · 苍狼王降临',
    narrative: '苍狼王自混沌虚空中踏步而来，狼瞳如电，气势滔天。\n它盯着你，一声低啸，像是宣告这场战斗的规则。\n你感到天机流转，时间凝固——此刻的选择，将决定整场战局的走向。',
    options: [
      {
        label: '以攻为守，先声夺人',
        description: '立刻倾泻全力，争取在苍狼王蓄力之前打乱其节奏',
        effectKey: 'hm_openingAggressive',
        effectValue: 0.25, // 开场15秒内攻击力+25%，但护盾值减半
        resultText: '你御剑疾冲，剑意迸发——苍狼王被你的凶猛气势短暂震慑，尚未蓄力成形。',
      },
      {
        label: '以静制动，借势而为',
        description: '观察苍狼王的攻击规律，寻找反击时机',
        effectKey: 'hm_openingCounterstrike',
        effectValue: 0.15, // 闪避+15%，并在首次闪避成功后触发反击（150%伤害）
        resultText: '你沉气凝神，剑悬身侧，等待苍狼王露出破绽——道家云：后发先至。',
      },
      {
        label: '护体真气全开',
        description: '以最稳健的姿态迎战，确保万无一失',
        effectKey: 'hm_openingDefend',
        effectValue: 80, // 获得80点护盾（不依赖Build）
        resultText: '真气凝聚于体表，化为一层淡金色光晕，你稳稳立于原地，以不变应万变。',
      },
    ],
  },

  // ── 75% 血量天机时刻 ──────────────────────────────────────
  {
    id: 'hm_cang_lang_75',
    triggerType: 'hp75',
    title: '天机时刻 · 苍狼王的怒吼',
    narrative: '苍狼王嗷叫长嚎，全身骤然乍现血光。\n它正在蓄积必杀之力——下一击将造成你当前生命的150%伤害。\n你感到天机流转，时间凝固，应对之策，只在此刻。',
    options: [
      {
        label: '护体真气全开',
        description: '将护盾值全部转化为本次伤害的减免',
        effectKey: 'hm_75Defend',
        effectValue: 0.8, // 本次伤害减至20%（消耗全部护盾值）
        resultText: '真气护体，将苍狼王的必杀之力强行消散大半——代价是护体真气尽数耗散。',
      },
      {
        label: '趁虚全力突进',
        description: '以反向爆发打断蓄力，将危机化为机遇',
        condition: {
          key: 'swordIntent',
          minValue: 50,
          displayText: '需剑意 ≥50层',
        },
        effectKey: 'hm_75Burst',
        effectValue: 8.0, // 造成800%攻击伤害，有35%概率在Boss HP<30%时直接终结
        resultText: '剑意炸裂，你倏然逆击而上——苍狼王的蓄力被生生打断，重创之下，它发出一声痛嚎。',
      },
      {
        label: '凌空闪退，以待时机',
        description: '完全规避本次攻击，但放弃当前积累',
        effectKey: 'hm_75Dodge',
        effectValue: 1.0, // 完全回避，但激活的协同效果中断至本战结束
        resultText: '你凌空跃起，轻巧避过苍狼王的重击——但气机断续，当前协同效果的共鸣被打散。',
      },
    ],
  },

  // ── 50% 血量第二阶段天机时刻 ────────────────────────────
  {
    id: 'hm_cang_lang_50',
    triggerType: 'hp50',
    title: '天机时刻 · 苍狼王·化神之怒',
    narrative: '苍狼王身形骤变，狼毛化为寒铁，双眼赤红如血。\n它进入了第二阶段——原有的剑意克制被它化解。\n它正在施展「魔化狂怒」：你的剑意积累效率将下降50%。',
    options: [
      {
        label: '接受削弱，以剑气硬推',
        description: '强行突破削弱，用纯粹的剑气碾压',
        effectKey: 'hm_50AcceptDebuff',
        effectValue: 0.3, // 接受剑意-50%削弱，但本次获得全局攻击力+30%补偿
        resultText: '你深吸一口气，剑意虽然流失，但剑气反而愈发纯粹——失之东隅，收之桑榆。',
      },
      {
        label: '临时转换「炼体」策略',
        description: '本战切换为炼体防反模式，无视剑意削弱',
        condition: {
          key: 'hasSkillTag',
          tag: 'body',
          displayText: '需含「炼体」类功法节点',
        },
        spiritRootExclusive: 'body' as any,
        effectKey: 'hm_50BodySwitch',
        effectValue: 0.5, // 本战无视剑意削弱，并激活炼体防反模式（伤害转化为护盾）
        resultText: '你收剑归鞘，转而催动体内的炼体真气——魔化之力对你如同无物，苍狼王的算计落空。',
      },
      {
        label: '使用「封印符」',
        description: '消耗1枚封印符，抵消本次阶段变化效果',
        condition: {
          key: 'hasSkillTag',
          tag: 'seal_talisman', // 需要商铺购买的封印符
          displayText: '需持有封印符×1（商铺购买）',
        },
        effectKey: 'hm_50Talisman',
        effectValue: 0,
        resultText: '你取出封印符，符文燃起金光，将「魔化狂怒」的气机完全封印——苍狼王怒目而视。',
      },
    ],
  },

  // ── 25% 血量垂死反扑 ─────────────────────────────────────
  {
    id: 'hm_cang_lang_25',
    triggerType: 'hp25',
    title: '天机时刻 · 垂死反扑',
    narrative: '苍狼王已近强弩之末，但它的眼中反而燃起决死之火。\n垂死之际，它汇聚了全身最后的凶性，准备以命换命——\n这一击，将同时损耗你25%当前生命，但能对它造成600%攻击力的终结之击。',
    options: [
      {
        label: '以命换命，终结战斗',
        description: '承受苍狼王的最后一击，同时给予致命反击',
        effectKey: 'hm_25MutualStrike',
        effectValue: 6.0, // 对Boss造成600%攻击伤害，但自身损失25%当前HP
        resultText: '剑意爆发至极限，你与苍狼王同时出手——血光迸现，胜负只在一线之间。',
      },
      {
        label: '剑气盾抵挡，稳健收尾',
        description: '用护盾消耗苍狼王的最后疯狂，再徐徐击杀',
        effectKey: 'hm_25ShieldTank',
        effectValue: 100, // 生成100点护盾，苍狼王攻击力-30%（精疲力竭状态）
        resultText: '你护体真气凝聚，稳稳接住苍狼王的最后疯狂——它已精疲力竭，再无反手之力。',
      },
    ],
  },
];

// ── 获取当前Boss的天机时刻列表 ───────────────────────────────

export function getBossHeavenlyMoments(): HeavenlyMoment[] {
  return BOSS_HEAVENLY_MOMENTS;
}
