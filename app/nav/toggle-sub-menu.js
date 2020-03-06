/*
 * toggle the main site menu (for small screens)
 */
const toggleSubMenus = document.querySelectorAll('[data-action="toggle-sub-menu"]')

toggleSubMenus.forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault()
    a.classList.toggle('open')
    a.nextElementSibling.classList.toggle('open')
    Array.from(a.querySelectorAll('.fa'))[1].classList.toggle('fa-caret-up')
    Array.from(a.querySelectorAll('.fa'))[1].classList.toggle('fa-caret-down')
  })
})
