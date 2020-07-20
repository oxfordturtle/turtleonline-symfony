const versionSelect = document.getElementById('version-select') as HTMLSelectElement
const downloadLink = document.getElementById('download-link') as HTMLAnchorElement

if (versionSelect && downloadLink) {
  versionSelect.addEventListener('change', () => {
    const bits = downloadLink.href.split('/')
    bits.pop()
    bits.push(versionSelect.value)
    downloadLink.setAttribute('href', bits.join('/'))
  })
}
