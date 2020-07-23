/**
 * Select menu for downloadable version.
 */

export default init()

/** initialise the select menu */
function init (): void {
  // get relevant elements
  const versionSelect = document.getElementById('version-select') as HTMLSelectElement
  const downloadLink = document.getElementById('download-link') as HTMLAnchorElement
  
  if (versionSelect && downloadLink) {
    // add event listener to change download link
    versionSelect.addEventListener('change', () => {
      const bits = downloadLink.href.split('/')
      bits.pop()
      bits.push(versionSelect.value)
      downloadLink.setAttribute('href', bits.join('/'))
    })
  }
}
