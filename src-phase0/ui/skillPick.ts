// ─── 境界突破 · 择法 UI ────────────────────────────────────────────
// 职责：展示三选一功法界面，必须在右上角显示当前 Build 简览（Q1 设计补丁）

import { SkillNode, RunState } from '../types';
import { drawSkillCandidates } from '../data/skills';

/**
 * 弹出节点选择界面
 * @param state  当前 Run 状态（用于 Build 简览和候选过滤）
 * @param onPick 玩家选中后的回调
 */
export function showSkillPick(state: RunState, onPick: (node: SkillNode) => void): void {
  const candidates = drawSkillCandidates(3, state.spiritRoot, state.skillTree.map(n => n.id));

  // ─── Build 简览 ──────────────────────────────────────────────────
  const treeEl = document.getElementById('sp-tree-summary')!;
  if (state.skillTree.length === 0) {
    treeEl.textContent = '当前功法：（尚未修炼）';
  } else {
    const tags = Array.from(new Set(state.skillTree.flatMap(n => n.synergyTags)));
    treeEl.textContent = `当前功法：${state.skillTree.map(n => n.name).join('、')} · 标签：${tags.join(' ')}`;
  }

  // ─── 候选节点卡片 ─────────────────────────────────────────────────
  const cardsEl = document.getElementById('sp-cards')!;
  cardsEl.innerHTML = '';

  for (const node of candidates) {
    const div = document.createElement('div');
    div.className = 'sp-card';

    const typeLabel = node.spiritRoot === 'universal' ? '通用功法' : `${node.spiritRoot}灵根专属`;
    const synHint = node.synergyTags.length > 0
      ? `<div class="sp-syn">相关协同：${node.synergyTags.length}个标签（${node.synergyTags.join('/')}）</div>`
      : '';

    div.innerHTML = `
      <div class="sp-name">${node.name}</div>
      <div class="sp-type">${typeLabel}</div>
      <div class="sp-desc">${node.description}</div>
      <div class="sp-flavor">"${node.flavorText}"</div>
      ${synHint}
    `;

    div.addEventListener('click', () => {
      hideSkillPick();
      onPick(node);
    });

    cardsEl.appendChild(div);
  }

  document.getElementById('skill-pick')!.classList.add('active');
}

export function hideSkillPick(): void {
  document.getElementById('skill-pick')!.classList.remove('active');
}
