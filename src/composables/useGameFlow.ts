import { ref } from 'vue'
import type { CombatLogEntry, Equipment, EquipSlot, HeavenlyMomentOption, EventChoice } from '@/types'
import { useRunStore } from '@/stores/run'
import { useMetaStore } from '@/stores/meta'
import { ZONE1_ENEMIES, ZONE2_ENEMIES, BOSS_CANG_LANG } from '@/data/enemies'
import { BOSS_HEAVENLY_MOMENTS } from '@/data/heavenlyMoments'
import { getFirstEvent, getRandomEvent } from '@/data/events'
import { rollEquipment } from '@/data/affixes'
import { pickSkillNode, equipItem } from '@/engine/run'
import { calcCombat } from '@/engine/combat'

// 组件引用类型
export interface CombatLogExpose {
  clearLogs: () => void
  appendLog: (entry: CombatLogEntry) => void
  playLogs: (entries: CombatLogEntry[], intervalMs?: number) => Promise<void>
}

export interface ActionAreaExpose {
  setAction: (title: string, narrative: string, choices: Array<{ label: string; onClick: () => void; primary?: boolean; disabled?: boolean }>) => void
  lockActions: () => void
  waitContinue: (label?: string) => Promise<void>
}

export interface HeavenlyMomentExpose {
  show: (hm: any, onPick: (opt: HeavenlyMomentOption) => void) => void
  hide: () => void
}

export interface SkillPickExpose {
  show: (onPick: (node: any) => void) => void
  hide: () => void
}

export interface EventExpose {
  show: (ev: any, onChoose: (choice: EventChoice) => void) => void
  hide: () => void
}

export interface LootExpose {
  show: (item: Equipment, onEquip: () => void, onStore: () => void, onDiscard: () => void) => void
  hide: () => void
}

export interface RunEndExpose {
  show: (victory: boolean, ctx?: string, detail?: string) => void
  hide: () => void
}

export function useGameFlow(refs: {
  combatLog: () => CombatLogExpose | null
  actionArea: () => ActionAreaExpose | null
  hmOverlay: () => HeavenlyMomentExpose | null
  skillPick: () => SkillPickExpose | null
  eventOverlay: () => EventExpose | null
  lootOverlay: () => LootExpose | null
  runEnd: () => RunEndExpose | null
}) {
  const runStore = useRunStore()
  const metaStore = useMetaStore()
  const aborted = ref(false)

  // ── 辅助 ────────────────────────
  function log(type: CombatLogEntry['type'], text: string) {
    refs.combatLog()?.appendLog({ type, text, timestamp: 0 })
  }

  async function waitContinue(label = '继续前行 →') {
    return refs.actionArea()?.waitContinue(label) ?? Promise.resolve()
  }

  function lockActions() {
    refs.actionArea()?.lockActions()
  }

  function showSynergyToast(name: string, isFirstEver: boolean) {
    const el = document.getElementById('synergy-toast')
    if (!el) return
    el.textContent = isFirstEver
      ? `✨ 天机初感应！你发现了第一个协同效果——${name}`
      : `天机感应：${name}`
    el.style.opacity = '1'
    setTimeout(() => { el.style.opacity = '0' }, isFirstEver ? 5000 : 3000)
  }

  // ── 战斗 ────────────────────────
  async function doCombat(enemy: any): Promise<void> {
    const state = runStore.state!
    const tier = enemy.tier === 'elite' ? '精英' : enemy.tier === 'boss' ? 'Boss' : '普通'
    const hint = enemy.tier === 'normal' ? '（普通敌人不消耗根基，自动战斗）' :
      enemy.tier === 'elite' ? '（精英敌人，注意保存根基）' : '（Boss！天机时刻将改变战局！）'

    refs.actionArea()?.setAction(`战斗准备 · ${enemy.name}`, `前方出现${tier}敌人「${enemy.name}」\n${hint}`, [])
    await waitContinue('御剑出击 →')
    lockActions()

    const result = calcCombat(state.stats, enemy)

    log('system', `━━━ 战斗开始 · ${enemy.name} ━━━`)
    await refs.combatLog()?.playLogs(result.logs)

    // 更新状态
    runStore.state!.combatCount++
    runStore.state!.stats.hp = enemy.tier === 'normal' ? state.stats.hp : Math.max(0, result.playerHpRemain)
    runStore.state!.stats.shield = result.playerShieldRemain
    runStore.state!.stats.swordIntent = Math.min(100, (state.stats.swordIntent ?? 0) + result.swordIntentGain)
    runStore.state!.daoYun += enemy.tier === 'normal' ? 1 : enemy.tier === 'elite' ? 5 : 20
    runStore.saveSnapshot()

    const durationS = (result.durationMs / 1000).toFixed(1)
    if (result.victory) {
      log('system', `✓ 战胜「${enemy.name}」，耗时 ${durationS}s`)
    } else {
      log('system', `✗ 败于「${enemy.name}」，耗时 ${durationS}s`)
      await showRunEnd(false, `于${enemy.name}之手`, `战斗时长${durationS}s，根基耗尽`)
      aborted.value = true
      return
    }

    // 装备掉落（精英/Boss）
    if (enemy.tier !== 'normal' && result.lootRoll > 0.3) {
      const slot: EquipSlot = (['weapon', 'armor', 'ring'] as EquipSlot[])[Math.floor(Math.random() * 3)]
      const equip = rollEquipment(slot, state.stats.luckDrop)
      if (equip) await doLootDecision(equip)
    }
  }

  // ── 掉落决策 ────────────────────────
  function doLootDecision(equip: Equipment): Promise<void> {
    return new Promise(resolve => {
      log('loot', `获得法宝：${equip.name}（${equip.quality}）`)
      refs.lootOverlay()?.show(
        equip,
        () => { runStore.equipItemToSlot(equip); resolve() },
        () => { runStore.storeItemToInventory(equip); resolve() },
        () => { runStore.state!.materials += 3; runStore.saveSnapshot(); resolve() }
      )
    })
  }

  // ── 择法 ────────────────────────
  function doSkillPick(contextLabel: string): Promise<void> {
    log('system', `━━━ ${contextLabel} ━━━`)
    return new Promise(resolve => {
      refs.skillPick()?.show(node => {
        const newSynergies = runStore.selectSkill(node)
        log('system', `修炼「${node.name}」：${node.description}`)
        for (const syn of newSynergies) {
          log('synergy', syn.logText)
          showSynergyToast(syn.name, metaStore.isFirstEver)
          metaStore.addDiscoveredSynergy(syn.id)
          runStore.state!.synergyTriggerCount++
        }
        runStore.saveSnapshot()
        resolve()
      })
    })
  }

  // ── 事件 ────────────────────────
  function doEvent(isFirst = false): Promise<void> {
    const event = isFirst ? getFirstEvent() : getRandomEvent([])
    log('system', `━━━ 奇遇：${event.title} ━━━`)
    return new Promise(resolve => {
      refs.eventOverlay()?.show(event, (choice: EventChoice) => {
        log('system', `选择：${choice.label}`)
        log('normal', choice.rewardText)
        if (choice.rewardType === 'stat_boost') {
          runStore.applyStatChange('fateDest', (choice.rewardValue ?? 0) / 100)
        } else if (choice.rewardType === 'material') {
          runStore.applyStatChange('materials', choice.rewardValue ?? 0)
        }
        runStore.applyStatChange('daoYun', 2)
        resolve()
      })
    })
  }

  // ── 天机时刻 ────────────────────────
  function doHeavenlyMoment(hmId: string): Promise<void> {
    const hm = BOSS_HEAVENLY_MOMENTS.find(h => h.id === hmId)
    if (!hm) return Promise.resolve()
    log('boss', `⚡ 天机时刻：${hm.title}`)
    return new Promise(resolve => {
      refs.hmOverlay()?.show(hm, (opt: HeavenlyMomentOption) => {
        applyHMEffect(opt)
        log('boss', opt.resultText)
        runStore.recordHeavenlyMoment(`${hm.id}:${opt.effectKey}`)
        resolve()
      })
    })
  }

  function applyHMEffect(opt: HeavenlyMomentOption) {
    const s = runStore.state!.stats
    switch (opt.effectKey) {
      case 'hm_openingAggressive':
        s.atk = Math.round(s.atk * (1 + opt.effectValue)); s.shield = Math.round(s.shield * 0.5); break
      case 'hm_openingCounterstrike': s.dodge += opt.effectValue; break
      case 'hm_openingDefend': s.shield += opt.effectValue; break
      case 'hm_75Defend': s.dmgReduce = Math.min(0.8, s.dmgReduce + opt.effectValue * 0.5); break
      case 'hm_75Burst': s.atk = Math.round(s.atk * (1 + opt.effectValue)); break
      case 'hm_75Dodge': s.dodge += opt.effectValue; break
      case 'hm_50AcceptDebuff': s.atk = Math.round(s.atk * (1 + opt.effectValue)); break
      case 'hm_50BodySwitch': s.dmgReduce = Math.min(0.8, s.dmgReduce + opt.effectValue * 0.4); break
      case 'hm_50Talisman': break
      case 'hm_25MutualStrike':
        s.atk = Math.round(s.atk * opt.effectValue)
        s.hp = Math.max(1, Math.round(s.hp * 0.75)); break
      case 'hm_25ShieldTank':
        s.shield += opt.effectValue
        s.dmgReduce = Math.min(0.8, s.dmgReduce + 0.1); break
    }
    runStore.saveSnapshot()
  }

  // ── Boss 段战斗 ────────────────────────
  async function doBossCombatSegment(segEnemy: any, phaseLabel: string) {
    log('boss', `━━━ ${phaseLabel} ━━━`)
    lockActions()

    const result = calcCombat(runStore.state!.stats, segEnemy)
    await refs.combatLog()?.playLogs(result.logs)

    const s = runStore.state!
    s.combatCount++
    s.stats.hp = Math.max(0, result.playerHpRemain)
    s.stats.shield = result.playerShieldRemain
    s.stats.swordIntent = Math.min(100, (s.stats.swordIntent ?? 0) + result.swordIntentGain)
    s.daoYun += 5
    runStore.saveSnapshot()

    const durationS = (result.durationMs / 1000).toFixed(1)
    if (result.victory) {
      log('boss', `苍狼王受挫，耗时 ${durationS}s`)
    } else {
      log('system', `✗ 败于苍狼王（${phaseLabel}），耗时 ${durationS}s`)
      await showRunEnd(false, `苍狼王·${phaseLabel}`, `战斗时长${durationS}s，根基耗尽`)
      aborted.value = true
    }
  }

  // ── Boss 全流程 ────────────────────────
  async function doBoss() {
    runStore.state!.currentZone = 2
    runStore.saveSnapshot()

    log('boss', '━━━ 最终关卡 · 苍狼王 ━━━')
    log('boss', '苍狼王自混沌虚空中踏步而来，狼瞳如电，气势滔天。')
    await waitContinue('迎战苍狼王 →')

    await doHeavenlyMoment('hm_cang_lang_opening')
    if (aborted.value) return

    const segHp = Math.round(BOSS_CANG_LANG.hp / 4)

    await doBossCombatSegment({ ...BOSS_CANG_LANG, hp: segHp }, '苍狼王 · 阶段一（100%→75%）')
    if (aborted.value) return
    await doHeavenlyMoment('hm_cang_lang_75')
    if (aborted.value) return

    await doBossCombatSegment({ ...BOSS_CANG_LANG, hp: segHp }, '苍狼王 · 阶段二（75%→50%）')
    if (aborted.value) return
    log('boss', '⚡ 苍狼王发出滔天狼啸，魔化之力涌现——进入化神之怒状态！')
    await doHeavenlyMoment('hm_cang_lang_50')
    if (aborted.value) return

    await doBossCombatSegment(
      { ...BOSS_CANG_LANG, hp: segHp, atk: Math.round(BOSS_CANG_LANG.atk * 1.3), dmgReduce: 0.22 },
      '苍狼王 · 化神之怒（50%→25%）'
    )
    if (aborted.value) return
    log('boss', '🐺 苍狼王已至强弩之末，却迸发出殊死之志！')
    await doHeavenlyMoment('hm_cang_lang_25')
    if (aborted.value) return

    await doBossCombatSegment(
      { ...BOSS_CANG_LANG, hp: segHp, atk: Math.round(BOSS_CANG_LANG.atk * 1.5), dmgReduce: 0.05 },
      '苍狼王 · 垂死反扑（25%→0%）'
    )
    if (aborted.value) return

    log('boss', '苍狼王轰然倒地，魔气四散——此地从此清明。')
    runStore.state!.daoYun += 20
    const loot = rollEquipment('weapon', runStore.state!.stats.luckDrop)
    if (loot) await doLootDecision(loot)
  }

  // ── 道途分叉 ────────────────────────
  function doZoneFork(): Promise<void> {
    log('system', '━━━ 道途分叉 · 幽冥古道入口 ━━━')
    return new Promise(resolve => {
      refs.actionArea()?.setAction(
        '道途分叉：前方二路',
        '北荒精英已伏，前方道路一分为二。\n气机指引你二择其一——道途将决定后续机缘。',
        [
          {
            label: '⚔ 血战古道（高风险）',
            primary: true,
            onClick: async () => {
              log('system', '踏入血战古道——战意滔天，根基淬炼更深，但敌患更烈。')
              runStore.applyStatChange('atkPct', 0.08)
              runStore.applyStatChange('daoYun', 3)
              await waitContinue('深入古道 →')
              resolve()
            },
          },
          {
            label: '🌿 幽谷秘境（稳健）',
            onClick: async () => {
              log('system', '踏入幽谷秘境——灵气充沛，根基壮实，境界机缘更丰。')
              runStore.applyStatChange('maxHp', 200)
              runStore.applyStatChange('daoYun', 3)
              await waitContinue('深入秘境 →')
              resolve()
            },
          },
        ]
      )
    })
  }

  // ── 结算 ────────────────────────
  async function showRunEnd(victory: boolean, ctx: string, detail: string) {
    refs.runEnd()?.show(victory, ctx, detail)
  }

  // ── 主流程 ────────────────────────
  async function runFlow() {
    aborted.value = false
    refs.combatLog()?.clearLogs()

    const state = runStore.state!
    state.currentZone = 0
    runStore.saveSnapshot()

    log('system', '═══ 踏入北荒边境 ═══')
    refs.actionArea()?.setAction('北荒边境', '荒野之中，危机四伏。凛冽的北风携着血腥气息袭来，前路漫漫。', [])
    await waitContinue('踏入北荒 →')

    await doCombat(ZONE1_ENEMIES[0]); if (aborted.value) return
    await doCombat(ZONE1_ENEMIES[1]); if (aborted.value) return
    await doEvent(true)
    await doCombat(ZONE1_ENEMIES[2]); if (aborted.value) return
    await doSkillPick('第一次境界突破')
    await doCombat(ZONE1_ENEMIES[3]); if (aborted.value) return
    await doSkillPick('第二次境界突破')
    await doZoneFork()

    runStore.state!.currentZone = 1
    runStore.saveSnapshot()
    log('system', '═══ 踏入幽冥古道 ═══')
    refs.actionArea()?.setAction('幽冥古道', '古道幽深，鬼气森森，这里是修魔者的墓场。你感到一股莫名的危机。', [])
    await waitContinue('深入古道 →')

    await doCombat(ZONE2_ENEMIES[0]); if (aborted.value) return
    await doEvent()
    await doCombat(ZONE2_ENEMIES[1]); if (aborted.value) return
    await doSkillPick('第三次境界突破')
    await doCombat(ZONE2_ENEMIES[2]); if (aborted.value) return
    await doSkillPick('第四次境界突破')
    await doCombat(ZONE2_ENEMIES[3]); if (aborted.value) return
    await doSkillPick('第五次境界突破')

    await doBoss()
    if (!aborted.value) await showRunEnd(true, '', '')
  }

  // ── 续局 ────────────────────────
  async function resumeFlow() {
    aborted.value = false
    refs.combatLog()?.clearLogs()

    const z = runStore.state!.currentZone
    const zoneNames = ['北荒边境', '幽冥古道', '苍狼王领地']
    const state = runStore.state!

    log('system', `═══ 续局恢复 · ${zoneNames[Math.min(2, z)]} ═══`)
    log('system', `功法：${state.skillTree.map(n => n.name).join('、') || '尚无'} · 道韵${state.daoYun} · 战${state.combatCount}场`)
    refs.actionArea()?.setAction('续局', `已从「${zoneNames[Math.min(2, z)]}」恢复，功法与装备完整保留。`, [])
    await waitContinue('继续前行 →')

    if (z <= 0) {
      log('system', '（续局：已跳过北荒早期战斗，从精英战恢复）')
      await doCombat(ZONE1_ENEMIES[3]); if (aborted.value) return
      await doSkillPick('境界突破')
      await doZoneFork(); if (aborted.value) return
      runStore.state!.currentZone = 1
      log('system', '═══ 踏入幽冥古道 ═══')
      await waitContinue('深入古道 →')
      await doCombat(ZONE2_ENEMIES[0]); if (aborted.value) return
      await doEvent()
      await doCombat(ZONE2_ENEMIES[1]); if (aborted.value) return
      await doSkillPick('境界突破')
      await doCombat(ZONE2_ENEMIES[2]); if (aborted.value) return
      await doSkillPick('境界突破')
      await doCombat(ZONE2_ENEMIES[3]); if (aborted.value) return
      await doSkillPick('境界突破')
    } else if (z === 1) {
      log('system', '（续局：从幽冥古道重新推进）')
      runStore.state!.currentZone = 1
      log('system', '═══ 踏入幽冥古道 ═══')
      await waitContinue('深入古道 →')
      await doCombat(ZONE2_ENEMIES[0]); if (aborted.value) return
      await doEvent()
      await doCombat(ZONE2_ENEMIES[1]); if (aborted.value) return
      await doSkillPick('境界突破')
      await doCombat(ZONE2_ENEMIES[2]); if (aborted.value) return
      await doSkillPick('境界突破')
      await doCombat(ZONE2_ENEMIES[3]); if (aborted.value) return
      await doSkillPick('境界突破')
    }

    await doBoss()
    if (!aborted.value) await showRunEnd(true, '', '')
  }

  return { runFlow, resumeFlow }
}
