/*
 * Interactive functionality for the main site menu.
 */
/*
// add click event listeners to menu items
for (const a of document.querySelectorAll('[data-action="toggle-menu"]')) {
  a.addEventListener('click', () => {
    if (a.classList.contains('open')) {
      closeMenu(a)
    } else {
      openMenu(a)
    }
  })
}

// closes a menu
function closeMenu (a: Element): void {
  const menu = a.nextElementSibling
  const caret = a.querySelector('.icon:last-child .fa')
  a.classList.remove('open')
  menu.classList.remove('open')
  if (caret) {
    caret.classList.remove('fa-caret-up')
    caret.classList.add('fa-caret-down')
  }

  // close submenus recursively
  for (const subMenu of menu.querySelectorAll('[data-action="toggle-menu"]')) {
    closeMenu(subMenu)
  }
}

// opens a menu
function openMenu (a: Element): void {
  const menu = a.nextElementSibling
  const caret = a.querySelector('.icon:last-child .fa')
  a.classList.add('open')
  menu.classList.add('open')
  if (caret) {
    caret.classList.add('fa-caret-up')
    caret.classList.remove('fa-caret-down')
  }

  // close opposite menus
  for (const subMenu of getOppositeMenu(menu).querySelectorAll('[data-action="toggle-menu"]')) {
    closeMenu(subMenu)
  }
}

// gets a menu's opposite
function getOppositeMenu (element: Element): Element {
  if (element.parentElement.classList.contains('nav-left')) {
    return document.querySelector('.nav-right')
  }
  if (element.parentElement.classList.contains('nav-right')) {
    return document.querySelector('.nav-left')
  }
  return getOppositeMenu(element.parentElement)
}
*/
