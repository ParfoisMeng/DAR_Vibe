// ─── 天机时刻 UI ────────────────────────────────────────────────────
// 职责：弹出天机时刻选项界面，展示条件检测结果

import { HeavenlyMoment, HeavenlyMomentOption, RunState } from '../types';

/**
 * 展示天机时刻弹层
 * @param hm     天机时刻定义
 * @param state  当前 Run 状态（用于条件检测）
 * @param onPick 玩家选择后的回调
 */
export function showHeavenlyMoment(
  hm: HeavenlyMoment,
  state: RunState,
  onPick: (option: HeavenlyMomentOption) => void,
): void {
  const overlay = document.getElementById('hm-overlay')!;
  document.getElementById('hm-title')!.textContent = `⚡ ${hm.title}`;
  document.getElementById('hm-narrative')!.textContent = hm.narrative;

  const optEl = document.getElementById('hm-options')!;
  optEl.innerHTML = '';

  for (const opt of hm.options) {
    const div = document.createElement('div');

    // 检测灵根专属
    const rootLocked = opt.spiritRootExclusive && opt.spiritRootExclusive !== state.spiritRoot;
    // 检测数值条件
    const condMet = checkCondition(opt, state);
    const isLocked = rootLocked || !condMet;

    div.className = 'hm-opt' + (isLocked ? ' hm-opt-locked' : '');

    // 条件显示文本
    let condDisplay = '';
    if (opt.condition) {
      const currentVal = getCurrentValue(opt.condition.key, state);
      const met = condMet && !rootLocked;
      condDisplay = `<div class="hm-opt-cond ${met ? 'met' : 'unmet'}">${opt.condition.displayText} · 当前：${currentVal} ${met ? '✓' : '✗'}</div>`;
    }

    // 灵根专属标记
    const exclusiveTag = opt.spiritRootExclusive
      ? `<div style="font-size:10px;color:var(--purple);margin-top:2px">${opt.spiritRootExclusive}灵根专属</div>`
      : '';

    div.innerHTML = `
      <div class="hm-opt-label">${opt.label}</div>
      <div class="hm-opt-desc">${opt.description}</div>
      ${exclusiveTag}
      ${condDisplay}
    `;

    if (!isLocked) {
      div.addEventListener('click', () => {
        hideHeavenlyMoment();
        onPick(opt);
      });
    }

    optEl.appendChild(div);
  }

  overlay.classList.add('active');
}

export function hideHeavenlyMoment(): void {
  document.getElementById('hm-overlay')!.classList.remove('active');
}

/** 判断选项条件是否满足 */
function checkCondition(opt: HeavenlyMomentOption, state: RunState): boolean {
  if (!opt.condition) return true;
  const s = state.stats;
  switch (opt.condition.key) {
    case 'swordIntent':  return (s.swordIntent ?? 0) >= (opt.condition.minValue ?? 0);
    case 'shieldPct':    return s.shield / s.maxHp >= (opt.condition.minValue ?? 0);
    case 'hasSkillTag':  return state.skillTree.some(n => n.synergyTags.includes(opt.condition!.tag ?? ''));
    default:             return true;
  }
}

/** 获取条件对应的当前值（用于显示）*/
function getCurrentValue(key: string, state: RunState): string {
  const s = state.stats;
  switch (key) {
    case 'swordIntent': return `${Math.round(s.swordIntent ?? 0)}层`;
    case 'shieldPct':   return `${(s.shield / s.maxHp * 100).toFixed(0)}%`;
    case 'hasSkillTag': return '检查中';
    default:            return '—';
  }
}
