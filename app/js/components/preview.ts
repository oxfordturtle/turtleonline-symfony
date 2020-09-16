/**
 * Email preview in site admin area.
 */

export default init()

/** initialise email preview */
function init (): void {
  const preview = document.querySelector('[data-preview]') as HTMLElement
  if (preview && preview.dataset.preview) {
    const textarea = document.getElementById(preview.dataset.preview) as HTMLTextAreaElement
    textarea.addEventListener('change', (event: Event) => {
      const element = event.currentTarget as HTMLTextAreaElement
      preview.innerHTML = '<p>Dear <strong>{{ firstname }} {{ surname }}</strong>,</p>'
      preview.innerHTML += element.value
    })
  }
}
