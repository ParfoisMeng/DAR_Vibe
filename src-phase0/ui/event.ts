// ─── 事件 UI ────────────────────────────────────────────────────────
// 职责：弹出随机事件选项

import { GameEvent, EventChoice } from '../types';

export function showEvent(
  event: GameEvent,
  onChoose: (choice: EventChoice) => void,
): void {
  document.getElementById('ev-title')!.textContent = event.title;
  document.getElementById('ev-desc')!.textContent = event.description;

  const choicesEl = document.getElementById('ev-choices')!;
  choicesEl.innerHTML = '';

  for (const choice of event.choices) {
    const div = document.createElement('div');
    div.className = 'ev-choice';
    div.innerHTML = `
      <div class="ec-label">${choice.label}</div>
      <div class="ec-desc">${choice.description}</div>
    `;
    div.addEventListener('click', () => {
      hideEvent();
      onChoose(choice);
    });
    choicesEl.appendChild(div);
  }

  document.getElementById('event-panel')!.classList.add('active');
}

export function hideEvent(): void {
  document.getElementById('event-panel')!.classList.remove('active');
}
