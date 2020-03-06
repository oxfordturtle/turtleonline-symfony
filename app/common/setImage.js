export default function (selector, src) {
  Array.from(document.querySelectorAll(selector)).forEach((img) => {
    img.src = src
  })
}
