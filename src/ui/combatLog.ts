// ─── 战斗日志 UI ───────────────────────────────────────────────────
// 职责：接收 CombatLogEntry 序列，以动画方式逐条呈现到日志容器中

import { CombatLogEntry } from '../types';

const LOG_INTERVAL_MS = 120; // 每条日志的间隔

/** 将一条日志添加到容器并分类着色 */
function appendLogEntry(container: HTMLElement, entry: CombatLogEntry): void {
  const div = document.createElement('div');
  div.className = 'log-entry';

  switch (entry.type) {
    case 'system':  div.classList.add('log-system'); break;
    case 'crit':    div.classList.add('log-crit');   break;
    case 'synergy': div.classList.add('log-synergy'); break;
    case 'boss':    div.classList.add('log-boss');   break;
    case 'loot':    div.classList.add('log-loot');   break;
    default:        div.classList.add('log-normal');
  }

  div.textContent = entry.text;
  container.appendChild(div);
  // 自动滚动到底部
  container.scrollTop = container.scrollHeight;
}

/**
 * 将日志列表以动画方式逐条展示
 * @returns Promise，动画全部完成后 resolve
 */
export function playLogs(
  entries: CombatLogEntry[],
  intervalMs = LOG_INTERVAL_MS,
): Promise<void> {
  const container = document.getElementById('combat-log-container')!;
  return new Promise(resolve => {
    let i = 0;
    function next() {
      if (i >= entries.length) { resolve(); return; }
      appendLogEntry(container, entries[i]);
      i++;
      setTimeout(next, intervalMs);
    }
    next();
  });
}

/** 立即清空日志 */
export function clearLogs(): void {
  const container = document.getElementById('combat-log-container');
  if (container) container.innerHTML = '';
}

/** 立即追加单条日志（不带动画） */
export function appendLog(entry: CombatLogEntry): void {
  const container = document.getElementById('combat-log-container');
  if (container) appendLogEntry(container, entry);
}
