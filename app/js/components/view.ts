/** toggles a menu */
export function toggleMenu (id: string): void {
  const menu = document.querySelector(`[data-menu="${id}"]`)
  if (menu) {
    if (menu.classList.contains('open')) {
      closeMenu(id)
    } else {
      openMenu(id)
    }
  }
}

/** opens a menu */
export function openMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleMenu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-menu="${id}"]`)

  if (a && menu) {
    // close other menus
    switch (id) {
      case 'user':
        closeMenu('site')
        break
      case 'site': // fallthrough
      case 'documentation':
        closeMenu('user')
        break
    }

    // open the menu
    a.classList.add('open')
    menu.classList.add('open')

    // swap caret up/down
    const caret = a.querySelector('.fa-caret-down')
    if (caret) {
      caret.classList.remove('fa-caret-down')
      caret.classList.add('fa-caret-up')
    }
  }
}

/** closes a menu */
export function closeMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleMenu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-menu="${id}"]`)

  if (a && menu) {
    // close all sub menus
    for (const subMenu of menu.querySelectorAll('[data-menu]')) {
      closeMenu((subMenu as HTMLElement).dataset.menu as string)
    }
    for (const subMenu of menu.querySelectorAll('[data-system-menu]')) {
      closeSystemMenu((subMenu as HTMLElement).dataset.systemMenu as string)
    }

    // close the menu
    menu.classList.remove('open')
    a.classList.remove('open')

    // swap caret up/down
    const caret = a.querySelector('.fa-caret-up')
    if (caret) {
      caret.classList.remove('fa-caret-up')
      caret.classList.add('fa-caret-down')
    }
  }
}

/** toggles a system menu */
export function toggleSystemMenu (id: string): void {
  const menu = document.querySelector(`[data-system-menu="${id}"]`)
  if (menu) {
    if (menu.classList.contains('open')) {
      closeSystemMenu(id)
    } else {
      openSystemMenu(id)
    }
  }
}

/** opens a system menu */
export function openSystemMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleSystemMenu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-system-menu="${id}"]`)

  if (a && menu) {
    // open base system menu
    openMenu('system')

    // close all sibling menus
    const subMenus = a.parentElement?.parentElement?.querySelectorAll('[data-action="toggleSystemMenu"]')
    for (const subMenu of subMenus || []) {
      const id = (subMenu as HTMLElement).dataset.arg
      closeSystemMenu(id as string)
    }

    // open this menu
    a.classList.add('open')
    menu.classList.add('open')
  }
}

/** closes a system menu */
export function closeSystemMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleSystemMenu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-system-menu="${id}"]`)

  if (a && menu) {
    // close this menu
    a.classList.remove('open')
    menu.classList.remove('open')
  }
}

/** activates a tab */
export function selectTab (id: string): void {
  for (const select of document.querySelectorAll('[data-action="selectTab"]')) {
    for (const option of select.children) {
      if ((option as HTMLOptionElement).value === id) (option as HTMLOptionElement).selected = true
    }
  }
  for (const tabPane of document.querySelectorAll(`[data-tab="${id}"]`)) {
    if (tabPane.parentElement) {
      for (const sibling of tabPane.parentElement.children) {
        sibling.classList.remove('active')
      }
    }
    tabPane.classList.add('active')
  }
}
