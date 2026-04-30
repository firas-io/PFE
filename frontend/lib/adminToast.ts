/**
 * adminToast — Toast vanilla JS pour les pages admin.
 * Utilise les classes hf-toast de styles/components/_toast.css.
 */

const ICONS: Record<string, string> = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  danger:  `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

const VARIANT_MAP: Record<string, string> = {
  success: 'success',
  danger:  'error',
  warning: 'warning',
  info:    'info',
};

let _container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!_container || !document.body.contains(_container)) {
    _container = document.createElement('div');
    _container.className = 'hf-toasts';
    document.body.appendChild(_container);
  }
  return _container;
}

export function showToast(
  message: string,
  type: 'success' | 'danger' | 'warning' | 'info' = 'success',
) {
  if (typeof document === 'undefined') return;

  const variant  = VARIANT_MAP[type] ?? 'info';
  const container = getContainer();
  const el = document.createElement('div');
  el.className = `hf-toast hf-toast--${variant}`;
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.2s ease';
  el.innerHTML = `
    <span class="hf-toast-icon">${ICONS[type] ?? ICONS.info}</span>
    <div class="hf-toast-body">
      <p class="hf-toast-title">${message}</p>
    </div>
    <button class="hf-toast-close" aria-label="Fermer">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  });

  const close = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  };

  (el.querySelector('.hf-toast-close') as HTMLButtonElement | null)?.addEventListener('click', close);
  setTimeout(close, 4500);
}
