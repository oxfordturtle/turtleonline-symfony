// create an HTML element
export function element (type: string, options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  const element = document.createElement(type)

  if (content) {
    fill(element, content)
  }

  for (const [key, value] of Object.entries(options)) {
    switch (key) {
      case 'className':
        if (typeof value === 'string') {
          for (const className of value.split(' ')) {
            element.classList.add(className)
          }
        }
        break

      case 'value':
        if (typeof value === 'string') {
          (element as HTMLInputElement).value = value
        }
        break

      case 'on':
        if (Array.isArray(value)) {
          element.addEventListener(value[0], value[1])
        }
        break

      default:
        if (typeof value === 'string') {
          element.setAttribute(key, value)
        }
        break
    }
  }

  return element
}

// set the content of an HTML element / fragment
export function fill (element: HTMLElement|DocumentFragment, content: HTMLElement[]|string): void {
  if (Array.isArray(content)) {
    const fragment = document.createDocumentFragment()
    for (const element of content) {
      fragment.appendChild(element)
    }
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
    element.appendChild(fragment)
  } else {
    (element as HTMLElement).innerHTML = content
  }
}

// shorthand for creating the main root element
export function html (options: any = {}, content?: HTMLElement[]|string): HTMLHtmlElement {
  return element('html', options, content) as HTMLHtmlElement
}

// shorthands for creating document metadata elements
export function base (options: any = {}, content?: HTMLElement[]|string): HTMLBaseElement {
  return element('base', options, content) as HTMLBaseElement
}

export function head (options: any = {}, content?: HTMLElement[]|string): HTMLHeadElement {
  return element('head', options, content) as HTMLHeadElement
}

export function link (options: any = {}, content?: HTMLElement[]|string): HTMLLinkElement {
  return element('link', options, content) as HTMLLinkElement
}

export function meta (options: any = {}, content?: HTMLElement[]|string): HTMLMetaElement {
  return element('meta', options, content) as HTMLMetaElement
}

export function style (options: any = {}, content?: HTMLElement[]|string): HTMLStyleElement {
  return element('style', options, content) as HTMLStyleElement
}

export function title (options: any = {}, content?: HTMLElement[]|string): HTMLTitleElement {
  return element('title', options, content) as HTMLTitleElement
}

// shorthand for creating the sectioning root element
export function body (options: any = {}, content?: HTMLElement[]|string): HTMLBodyElement {
  return element('body', options, content) as HTMLBodyElement
}

// shorthands for creating content sectioning elements
export function address (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('address', options, content) as HTMLElement
}

export function article (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('article', options, content) as HTMLElement
}

export function aside (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('aside', options, content) as HTMLElement
}

export function footer (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('footer', options, content) as HTMLElement
}

export function header (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('header', options, content) as HTMLElement
}

export function h1 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h1', options, content) as HTMLHeadingElement
}

export function h2 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h2', options, content) as HTMLHeadingElement
}

export function h3 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h3', options, content) as HTMLHeadingElement
}

export function h4 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h4', options, content) as HTMLHeadingElement
}

export function h5 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h5', options, content) as HTMLHeadingElement
}

export function h6 (options: any = {}, content?: HTMLElement[]|string): HTMLHeadingElement {
  return element('h6', options, content) as HTMLHeadingElement
}

export function hgroup (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('hgroup', options, content) as HTMLElement
}

export function main (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('main', options, content) as HTMLElement
}

export function nav (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('nav', options, content) as HTMLElement
}

export function section (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('section', options, content) as HTMLElement
}

// shorthands for creating text content elements
export function blockquote (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('blockquote', options, content) as HTMLElement
}

export function dd (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('dd', options, content) as HTMLElement
}

export function div (options: any = {}, content?: HTMLElement[]|string): HTMLDivElement {
  return element('div', options, content) as HTMLDivElement
}

export function dl (options: any = {}, content?: HTMLElement[]|string): HTMLDListElement {
  return element('dl', options, content) as HTMLDListElement
}

export function dt (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('dt', options, content) as HTMLElement
}

export function figcaption (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('figcaption', options, content) as HTMLElement
}

export function figure (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('figure', options, content) as HTMLElement
}

export function hr (options: any = {}, content?: HTMLElement[]|string): HTMLHRElement {
  return element('hr', options, content) as HTMLHRElement
}

export function li (options: any = {}, content?: HTMLElement[]|string): HTMLLIElement {
  return element('li', options, content) as HTMLLIElement
}

export function ol (options: any = {}, content?: HTMLElement[]|string): HTMLOListElement {
  return element('ol', options, content) as HTMLOListElement
}

export function p (options: any = {}, content?: HTMLElement[]|string): HTMLParagraphElement {
  return element('p', options, content) as HTMLParagraphElement
}

export function pre (options: any = {}, content?: HTMLElement[]|string): HTMLPreElement {
  return element('pre', options, content) as HTMLPreElement
}

export function ul (options: any = {}, content?: HTMLElement[]|string): HTMLUListElement {
  return element('ul', options, content) as HTMLUListElement
}

// shortcuts for creating inline text semantics elements
export function a (options: any = {}, content?: HTMLElement[]|string): HTMLAnchorElement {
  return element('a', options, content) as HTMLAnchorElement
}

export function abbr (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('abbr', options, content) as HTMLElement
}

export function b (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('b', options, content) as HTMLElement
}

export function bdi (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('bdi', options, content) as HTMLElement
}

export function bdo (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('bdo', options, content) as HTMLElement
}

export function br (options: any = {}, content?: HTMLElement[]|string): HTMLBRElement {
  return element('br', options, content) as HTMLBRElement
}

export function cite (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('cite', options, content) as HTMLElement
}

export function code (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('code', options, content) as HTMLElement
}

export function data (options: any = {}, content?: HTMLElement[]|string): HTMLDataElement {
  return element('data', options, content) as HTMLDataElement
}

export function dfn (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('dfn', options, content) as HTMLElement
}

export function em (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('em', options, content) as HTMLElement
}

export function i (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('i', options, content) as HTMLElement
}

export function kbd (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('kbd', options, content) as HTMLElement
}

export function mark (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('mark', options, content) as HTMLElement
}

export function q (options: any = {}, content?: HTMLElement[]|string): HTMLQuoteElement {
  return element('q', options, content) as HTMLQuoteElement
}

export function rb (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('rb', options, content) as HTMLElement
}

export function rp (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('rp', options, content) as HTMLElement
}

export function rt (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('rt', options, content) as HTMLElement
}

export function rtc (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('rtc', options, content) as HTMLElement
}

export function ruby (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('ruby', options, content) as HTMLElement
}

export function s (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('s', options, content) as HTMLElement
}

export function samp (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('samp', options, content) as HTMLElement
}

export function small (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('small', options, content) as HTMLElement
}

export function span (options: any = {}, content?: HTMLElement[]|string): HTMLSpanElement {
  return element('span', options, content) as HTMLSpanElement
}

export function strong (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('strong', options, content) as HTMLElement
}

export function sub (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('sub', options, content) as HTMLElement
}

export function sup (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('sup', options, content) as HTMLElement
}

export function time (options: any = {}, content?: HTMLElement[]|string): HTMLTimeElement {
  return element('time', options, content) as HTMLTimeElement
}

export function u (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('u', options, content) as HTMLElement
}

export function _var (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('var', options, content) as HTMLElement
}

export function wbr (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('wbr', options, content) as HTMLElement
}

// shorthands for creating image and multimedia elements
export function area (options: any = {}, content?: HTMLElement[]|string): HTMLAreaElement {
  return element('area', options, content) as HTMLAreaElement
}

export function audio (options: any = {}, content?: HTMLElement[]|string): HTMLAudioElement {
  return element('audio', options, content) as HTMLAudioElement
}

export function img (options: any = {}, content?: HTMLElement[]|string): HTMLImageElement {
  return element('img', options, content) as HTMLImageElement
}

export function map (options: any = {}, content?: HTMLElement[]|string): HTMLMapElement {
  return element('map', options, content) as HTMLMapElement
}

export function track (options: any = {}, content?: HTMLElement[]|string): HTMLTrackElement {
  return element('track', options, content) as HTMLTrackElement
}

export function video (options: any = {}, content?: HTMLElement[]|string): HTMLVideoElement {
  return element('video', options, content) as HTMLVideoElement
}

// shorthands for creating embedded content elements
export function embed (options: any = {}, content?: HTMLElement[]|string): HTMLEmbedElement {
  return element('embed', options, content) as HTMLEmbedElement
}

export function iframe (options: any = {}, content?: HTMLElement[]|string): HTMLIFrameElement {
  return element('iframe', options, content) as HTMLIFrameElement
}

export function object (options: any = {}, content?: HTMLElement[]|string): HTMLObjectElement {
  return element('object', options, content) as HTMLObjectElement
}

export function param (options: any = {}, content?: HTMLElement[]|string): HTMLParamElement {
  return element('param', options, content) as HTMLParamElement
}

export function picture (options: any = {}, content?: HTMLElement[]|string): HTMLPictureElement {
  return element('picture', options, content) as HTMLPictureElement
}

export function source (options: any = {}, content?: HTMLElement[]|string): HTMLSourceElement {
  return element('source', options, content) as HTMLSourceElement
}

// shorthands for creating scripting elements
export function canvas (options: any = {}, content?: HTMLElement[]|string): HTMLCanvasElement {
  return element('canvas', options, content) as HTMLCanvasElement
}

export function noscript (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('noscript', options, content) as HTMLElement
}

export function script (options: any = {}, content?: HTMLElement[]|string): HTMLScriptElement {
  return element('script', options, content) as HTMLScriptElement
}

// shorthands for creating demarcating edits elements
export function ins (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('ins', options, content) as HTMLElement
}

export function del (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('del', options, content) as HTMLElement
}

// shorthands for creating table content elements
export function caption (options: any = {}, content?: HTMLElement[]|string): HTMLTableCaptionElement {
  return element('caption', options, content) as HTMLTableCaptionElement
}

export function col (options: any = {}, content?: HTMLElement[]|string): HTMLTableColElement {
  return element('col', options, content) as HTMLTableColElement
}

export function colgroup (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('colgroup', options, content) as HTMLElement
}

export function table (options: any = {}, content?: HTMLElement[]|string): HTMLTableElement {
  return element('table', options, content) as HTMLTableElement
}

export function tbody (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('tbody', options, content) as HTMLElement
}

export function td (options: any = {}, content?: HTMLElement[]|string): HTMLTableCellElement {
  return element('td', options, content) as HTMLTableCellElement
}

export function tfoot (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('tfoot', options, content) as HTMLElement
}

export function th (options: any = {}, content?: HTMLElement[]|string): HTMLTableHeaderCellElement {
  return element('th', options, content) as HTMLTableHeaderCellElement
}

export function thead (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('thead', options, content) as HTMLElement
}

export function tr (options: any = {}, content?: HTMLElement[]|string): HTMLTableRowElement {
  return element('tr', options, content) as HTMLTableRowElement
}

// shorthands for creating forms elements
export function button (options: any = {}, content?: HTMLElement[]|string): HTMLButtonElement {
  return element('button', options, content) as HTMLButtonElement
}

export function datalist (options: any = {}, content?: HTMLElement[]|string): HTMLDataListElement {
  return element('datalist', options, content) as HTMLDataListElement
}

export function fieldset (options: any = {}, content?: HTMLElement[]|string): HTMLFieldSetElement {
  return element('fieldset', options, content) as HTMLFieldSetElement
}

export function form (options: any = {}, content?: HTMLElement[]|string): HTMLFormElement {
  return element('form', options, content) as HTMLFormElement
}

export function input (options: any = {}, content?: HTMLElement[]|string): HTMLInputElement {
  return element('input', options, content) as HTMLInputElement
}

export function label (options: any = {}, content?: HTMLElement[]|string): HTMLLabelElement {
  return element('label', options, content) as HTMLLabelElement
}

export function legend (options: any = {}, content?: HTMLElement[]|string): HTMLLegendElement {
  return element('legend', options, content) as HTMLLegendElement
}

export function meter (options: any = {}, content?: HTMLElement[]|string): HTMLMeterElement {
  return element('meter', options, content) as HTMLMeterElement
}

export function optgroup (options: any = {}, content?: HTMLElement[]|string): HTMLOptGroupElement {
  return element('optgroup', options, content) as HTMLOptGroupElement
}

export function option (options: any = {}, content?: HTMLElement[]|string): HTMLOptionElement {
  return element('option', options, content) as HTMLOptionElement
}

export function output (options: any = {}, content?: HTMLElement[]|string): HTMLOutputElement {
  return element('output', options, content) as HTMLOutputElement
}

export function progress (options: any = {}, content?: HTMLElement[]|string): HTMLProgressElement {
  return element('progress', options, content) as HTMLProgressElement
}

export function select (options: any = {}, content?: HTMLElement[]|string): HTMLSelectElement {
  return element('select', options, content) as HTMLSelectElement
}

export function textarea (options: any = {}, content?: HTMLElement[]|string): HTMLTextAreaElement {
  return element('textarea', options, content) as HTMLTextAreaElement
}

// shorthands for creating interactive elements
export function details (options: any = {}, content?: HTMLElement[]|string): HTMLDetailsElement {
  return element('details', options, content) as HTMLDetailsElement
}

export function dialog (options: any = {}, content?: HTMLElement[]|string): HTMLDialogElement {
  return element('dialog', options, content) as HTMLDialogElement
}

export function menu (options: any = {}, content?: HTMLElement[]|string): HTMLMenuElement {
  return element('menu', options, content) as HTMLMenuElement
}

export function summary (options: any = {}, content?: HTMLElement[]|string): HTMLElement {
  return element('summary', options, content) as HTMLElement
}


// shorthands for creating web components elements
export function slot (options: any = {}, content?: HTMLElement[]|string): HTMLSlotElement {
  return element('slot', options, content) as HTMLSlotElement
}

export function template (options: any = {}, content?: HTMLElement[]|string): HTMLTemplateElement {
  return element('template', options, content) as HTMLTemplateElement
}
