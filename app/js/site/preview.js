const preview = document.querySelector('[data-preview]')

function updatePreview (event) {
  preview.innerHTML = '<p>Dear <strong>{{ firstname }} {{ surname }}</strong>,</p>'
  preview.innerHTML += event.currentTarget.value
}

if (preview) {
  const textarea = document.getElementById(preview.dataset.preview)
  textarea.addEventListener('change', updatePreview)
}
