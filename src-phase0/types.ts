// ============================================================
//  核心类型定义
//  问道无界 Phase 0 原型
// ============================================================

// ── 基础属性 ──────────────────────────────────────────────

export interface Stats {
  atk: number;         // 攻击力（剑气）
  atkSpeed: number;    // 攻速（每秒攻击次数）
  critRate: number;    // 暴击率 0~1
  critDmg: number;     // 暴击伤害倍率（默认 1.5）
  hp: number;          // 当前生命（根基）
  maxHp: number;       // 最大生命
  shield: number;      // 护体真气（护盾值）
  dmgReduce: number;   // 减伤率 0~1
  dodge: number;       // 闪避率 0~1
  // 特殊属性
  swordIntent: number; // 剑意层数（0~100）
  luckDrop: number;    // 掉落幸运 0~1（影响词缀品质）
  fateDest: number;    // 天命值（影响稀有事件权重）
}

export function defaultStats(): Stats {
  return {
    atk: 500, atkSpeed: 1.2, critRate: 0.1, critDmg: 1.5,
    hp: 2500, maxHp: 2500, shield: 0, dmgReduce: 0, dodge: 0,
    swordIntent: 0, luckDrop: 0, fateDest: 0,
  };
}

// ── 战斗日志 ─────────────────────────────────────────────

export type LogType = 'normal' | 'crit' | 'synergy' | 'boss' | 'system' | 'loot';

export interface CombatLogEntry {
  type: LogType;
  text: string;
  timestamp: number; // 战斗内毫秒时间戳
}

// ── 敌人 ─────────────────────────────────────────────────

export type EnemyTier = 'normal' | 'elite' | 'boss';

export interface Enemy {
  id: string;
  name: string;
  tier: EnemyTier;
  hp: number;
  atk: number;
  atkSpeed: number;
  dmgReduce: number;
  // Boss 专属
  phases?: BossPhase[];
}

export interface BossPhase {
  triggerHpPct: number;   // 触发血量百分比 0~1
  description: string;    // 阶段名描述
  buffKey: string;        // 应用的增益/削弱标识
}

// ── 战斗结算结果 ─────────────────────────────────────────

export interface CombatResult {
  victory: boolean;
  durationMs: number;         // 战斗耗时（毫秒，模拟时间）
  playerHpRemain: number;     // 战斗结束后玩家剩余HP（仅精英/Boss会扣血）
  playerShieldRemain: number;
  swordIntentGain: number;    // 本次战斗剑意增量
  logs: CombatLogEntry[];     // 战斗日志（逐行）
  lootRoll: number;           // 掉落随机种子 0~1（用于后续判定装备品质）
}

// ── 功法节点 ─────────────────────────────────────────────

export type SkillType = 'active' | 'passive' | 'conditional';
export type SpiritRoot = 'sword' | 'body' | 'tao' | 'fire' | 'ice';

export interface SkillNode {
  id: string;
  name: string;
  type: SkillType;
  spiritRoot: SpiritRoot | 'universal';
  description: string;           // 效果描述（数值化）
  flavorText: string;            // 仙侠风格短语
  synergyTags: string[];         // 参与协同的标签
  synergyCount: number;          // 相关协同数（展示用，不暴露具体内容）
  // 效果载体（通过 applySkill 函数处理）
  effectKey: string;             // 效果函数名
  effectValue: number;           // 效果数值
}

// ── 协同效果 ─────────────────────────────────────────────

export type SynergyTier = 'commonA' | 'commonB' | 'rare' | 'epic';

export interface Synergy {
  id: string;
  name: string;
  tier: SynergyTier;
  // 触发条件
  requiredTag: string;           // 必要标签（A型：含此标签即触发）
  enhanceTag?: string;           // 加强标签（A型：含此标签时效果增强）
  requiredTags?: string[];       // 多标签组合（B型）
  // 效果
  baseEffectKey: string;         // 基础效果函数名
  baseEffectValue: number;
  enhancedEffectKey?: string;    // 加强效果函数名（A型专属）
  enhancedEffectValue?: number;
  // 展示
  logText: string;               // 触发时的仙侠叙事日志（严禁机制描述词汇）
  journalName: string;           // 天机图鉴显示名
  journalDesc: string;           // 天机图鉴详细描述（已发现后展示）
}

// ── 装备与词缀 ───────────────────────────────────────────

export type EquipSlot = 'weapon' | 'armor' | 'ring';
export type ItemQuality = 'mortal' | 'spirit' | 'rare' | 'supreme' | 'immortal';
export type AffixTier = 'basic' | 'trigger' | 'synergy';

export interface Affix {
  id: string;
  name: string;
  tier: AffixTier;
  description: string;
  synergyTags: string[];
  synergyCount: number;
  effectKey: string;
  effectValue: number;
}

export interface Equipment {
  id: string;
  instanceId: string;            // 运行时唯一 ID
  slot: EquipSlot;
  quality: ItemQuality;
  name: string;
  affixes: Affix[];
}

// ── 文字事件 ─────────────────────────────────────────────

export type EventRewardType = 'skill_shard' | 'material' | 'stat_boost' | 'nothing';

export interface EventChoice {
  label: string;
  description: string;
  rewardType: EventRewardType;
  rewardValue?: number;
  rewardText: string;           // 结果文字
}

export interface GameEvent {
  id: string;
  tier: 'good' | 'medium' | 'neutral'; // 品质（底线保障使用）
  title: string;
  description: string;          // 2~3 行场景描述
  choices: EventChoice[];
}

// ── 天机时刻 ─────────────────────────────────────────────

export interface HeavenlyMomentOption {
  label: string;
  description: string;
  condition?: {                  // 可选条件（满足时才显示）
    key: 'swordIntent' | 'shieldPct' | 'hasSkillTag';
    minValue?: number;
    tag?: string;
    displayText: string;        // 「需剑意≥50层 · 当前：67层 ✓」格式
  };
  spiritRootExclusive?: SpiritRoot; // 灵根专属选项（仅该灵根可用）
  effectKey: string;
  effectValue: number;
  resultText: string;           // 选择后日志文字
}

export interface HeavenlyMoment {
  id: string;
  triggerType: 'opening' | 'hp75' | 'hp50' | 'hp25' | 'playerLow';
  title: string;
  narrative: string;            // 叙事文字（2~3 行）
  options: HeavenlyMomentOption[];
}

// ── Run 状态 ─────────────────────────────────────────────

export interface RunState {
  // 基础
  runId: string;
  spiritRoot: SpiritRoot;
  currentZone: number;          // 0-based
  currentNodeIndex: number;
  phase: RunPhase;
  // 角色
  stats: Stats;
  equippedItems: Partial<Record<EquipSlot, Equipment>>;
  inventory: Equipment[];       // 背包（待处理装备）
  // Build
  skillTree: SkillNode[];       // 已选功法节点
  activeSynergies: Synergy[];   // 当前激活协同
  // 资源
  materials: number;            // 炼化材料
  daoYun: number;               // 本局累积道韵（结算时给予永久存储）
  // 历史
  heavenlyMomentHistory: string[]; // 已做过的天机时刻选择（用于死亡精确归因）
  combatCount: number;
  synergyTriggerCount: number;
}

export type RunPhase =
  | 'spiritRootSelect'
  | 'zoneStart'
  | 'combat'
  | 'elite'
  | 'skillPick'
  | 'event'
  | 'boss'
  | 'heavenlyMoment'
  | 'zoneFork'
  | 'runEnd';

// ── 永久存档 ─────────────────────────────────────────────

export interface MetaData {
  totalRuns: number;
  totalDaoYun: number;
  spentDaoYun: number;
  warehouse: Equipment[];       // 仓库（20件上限）
  discoveredSynergies: string[]; // 已发现协同 ID 列表
  obsessions: string[];         // 执念词缀 ID 列表（最多3个）
  // 软保底计数
  obsessionHuntCount: Record<string, number>; // 词缀ID -> 未获得局数
  // 传承树
  inheritedNodes: string[];     // 已购买传承节点 ID 列表
}

export function defaultMeta(): MetaData {
  return {
    totalRuns: 0, totalDaoYun: 0, spentDaoYun: 0,
    warehouse: [], discoveredSynergies: [], obsessions: [],
    obsessionHuntCount: {}, inheritedNodes: [],
  };
}
