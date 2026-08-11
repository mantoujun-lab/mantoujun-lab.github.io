/**
 * 主题切换 + 移动端抽屉关闭
 * 由 index.astro 通过 <script> import 引入，Astro 会自动打包。
 */

function initTheme(): void {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  const controller = document.querySelector<HTMLInputElement>('.theme-controller');
  if (controller) controller.checked = theme === 'dark';

  document.addEventListener('change', (e) => {
    const target = e.target as HTMLElement | null;
    if (target?.classList.contains('theme-controller')) {
      const next = (target as HTMLInputElement).checked ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
  });
}

function initDrawer(): void {
  document.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', () => {
      const drawer = document.getElementById('nav-drawer') as HTMLInputElement | null;
      if (drawer) drawer.checked = false;
    });
  });
}

initTheme();
initDrawer();
