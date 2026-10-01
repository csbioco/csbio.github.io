// Native disclosure menus work with pointer, touch, and keyboard.
const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  siteNav.classList.toggle('is-open', !expanded);
});
const menus = [...document.querySelectorAll('.nav-dropdown')];
menus.forEach(menu => menu.addEventListener('toggle', () => {
  if (menu.open) menus.filter(other => other !== menu).forEach(other => { other.open = false; });
}));
document.addEventListener('click', event => {
  menus.filter(menu => !menu.contains(event.target)).forEach(menu => { menu.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openMenu = menus.find(menu => menu.open);
  if (openMenu) {
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  } else if (siteNav.classList.contains('is-open')) {
    siteNav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});
