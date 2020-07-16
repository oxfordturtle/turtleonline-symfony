/**
 * Preview email as HTML in the admin area.
 */
// check for the preview element
const preview = document.querySelector('[data-preview]')

// add event listener if it exists on the page
if (preview) {
  const textarea = document.getElementById((preview as HTMLElement).dataset.preview)
  textarea.addEventListener('change', updatePreview)
}

// updates the preview with the value of the event's target
function updatePreview (event: Event): void {
  const element = event.currentTarget as HTMLTextAreaElement
  preview.innerHTML = '<p>Dear <strong>{{ firstname }} {{ surname }}</strong>,</p>'
  preview.innerHTML += element.value
}
