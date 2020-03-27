/*
 * toggle the main site menu (for small screens)
 */
function getSubMenus (element: Document|Element): Element[] {
  return Array.from(element.querySelectorAll('[data-action="toggle-menu"]'))
}

function getOppositeMenuClass (element: Element): string {
  if (element.parentElement.classList.contains('nav-left')) {
    return '.nav-right'
  }
  if (element.parentElement.classList.contains('nav-right')) {
    return '.nav-left'
  }
  return getOppositeMenuClass(element.parentElement)
}

function closeMenu (a: Element): void {
  const menu = a.nextElementSibling
  const caret = a.querySelector('.icon:last-child .fa')
  a.classList.remove('open')
  menu.classList.remove('open')
  if (caret) {
    caret.classList.remove('fa-caret-up')
    caret.classList.add('fa-caret-down')
  }
  getSubMenus(menu).forEach(closeMenu)
}

function openMenu (a: Element): void {
  const menu = a.nextElementSibling
  const caret = a.querySelector('.icon:last-child .fa')
  a.classList.add('open')
  menu.classList.add('open')
  if (caret) {
    caret.classList.add('fa-caret-up')
    caret.classList.remove('fa-caret-down')
  }
  getSubMenus(document.querySelector(getOppositeMenuClass(a))).forEach(closeMenu)
}

getSubMenus(document).forEach((a) => {
  a.addEventListener('click', () => {
    if (a.classList.contains('open')) {
      closeMenu(a)
    } else {
      openMenu(a)
    }
  })
})
