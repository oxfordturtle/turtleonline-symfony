/**
 * show preview of email as HTML
 */
const preview = document.querySelector('[data-preview]') as HTMLElement

function updatePreview (event: Event): void {
  const element = event.currentTarget as HTMLTextAreaElement
  preview.innerHTML = '<p>Dear <strong>{{ firstname }} {{ surname }}</strong>,</p>'
  preview.innerHTML += element.value
}

if (preview) {
  const textarea = document.getElementById(preview.dataset.preview)
  textarea.addEventListener('change', updatePreview)
}
