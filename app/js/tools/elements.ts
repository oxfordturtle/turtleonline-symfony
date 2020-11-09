/** creates an HTML element */
export function element (type: string, options: any = {}): HTMLElement {
  const element = document.createElement(type)

  for (const [key, value] of Object.entries(options)) {
    switch (key) {
      case 'content':
        if (Array.isArray(value) || typeof value === 'string') {
          fill(element, value)
        }
        break

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

/** sets the content of an HTML element / fragment */
export function fill (element: HTMLElement|DocumentFragment, content: (HTMLElement|DocumentFragment)[]|string): void {
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

/** creates a document fragment */
export function fragment (content: (HTMLElement|DocumentFragment)[]): DocumentFragment {
  const fragment = document.createDocumentFragment()
  fill(fragment, content)
  return fragment
}

/** creates an html root element */
export function html (options: any = {}): HTMLHtmlElement {
  return element('html', options) as HTMLHtmlElement
}

// shorthands for creating document metadata elements
export function base (options: any = {}): HTMLBaseElement {
  return element('base', options) as HTMLBaseElement
}

export function head (options: any = {}): HTMLHeadElement {
  return element('head', options) as HTMLHeadElement
}

export function link (options: any = {}): HTMLLinkElement {
  return element('link', options) as HTMLLinkElement
}

export function meta (options: any = {}): HTMLMetaElement {
  return element('meta', options) as HTMLMetaElement
}

export function style (options: any = {}): HTMLStyleElement {
  return element('style', options) as HTMLStyleElement
}

export function title (options: any = {}): HTMLTitleElement {
  return element('title', options) as HTMLTitleElement
}

// shorthand for creating the sectioning root element
export function body (options: any = {}): HTMLBodyElement {
  return element('body', options) as HTMLBodyElement
}

// shorthands for creating content sectioning elements
export function address (options: any = {}): HTMLElement {
  return element('address', options) as HTMLElement
}

export function article (options: any = {}): HTMLElement {
  return element('article', options) as HTMLElement
}

export function aside (options: any = {}): HTMLElement {
  return element('aside', options) as HTMLElement
}

export function footer (options: any = {}): HTMLElement {
  return element('footer', options) as HTMLElement
}

export function header (options: any = {}): HTMLElement {
  return element('header', options) as HTMLElement
}

export function h1 (options: any = {}): HTMLHeadingElement {
  return element('h1', options) as HTMLHeadingElement
}

export function h2 (options: any = {}): HTMLHeadingElement {
  return element('h2', options) as HTMLHeadingElement
}

export function h3 (options: any = {}): HTMLHeadingElement {
  return element('h3', options) as HTMLHeadingElement
}

export function h4 (options: any = {}): HTMLHeadingElement {
  return element('h4', options) as HTMLHeadingElement
}

export function h5 (options: any = {}): HTMLHeadingElement {
  return element('h5', options) as HTMLHeadingElement
}

export function h6 (options: any = {}): HTMLHeadingElement {
  return element('h6', options) as HTMLHeadingElement
}

export function hgroup (options: any = {}): HTMLElement {
  return element('hgroup', options) as HTMLElement
}

export function main (options: any = {}): HTMLElement {
  return element('main', options) as HTMLElement
}

export function nav (options: any = {}): HTMLElement {
  return element('nav', options) as HTMLElement
}

export function section (options: any = {}): HTMLElement {
  return element('section', options) as HTMLElement
}

// shorthands for creating text content elements
export function blockquote (options: any = {}): HTMLElement {
  return element('blockquote', options) as HTMLElement
}

export function dd (options: any = {}): HTMLElement {
  return element('dd', options) as HTMLElement
}

export function div (options: any = {}): HTMLDivElement {
  return element('div', options) as HTMLDivElement
}

export function dl (options: any = {}): HTMLDListElement {
  return element('dl', options) as HTMLDListElement
}

export function dt (options: any = {}): HTMLElement {
  return element('dt', options) as HTMLElement
}

export function figcaption (options: any = {}): HTMLElement {
  return element('figcaption', options) as HTMLElement
}

export function figure (options: any = {}): HTMLElement {
  return element('figure', options) as HTMLElement
}

export function hr (options: any = {}): HTMLHRElement {
  return element('hr', options) as HTMLHRElement
}

export function li (options: any = {}): HTMLLIElement {
  return element('li', options) as HTMLLIElement
}

export function ol (options: any = {}): HTMLOListElement {
  return element('ol', options) as HTMLOListElement
}

export function p (options: any = {}): HTMLParagraphElement {
  return element('p', options) as HTMLParagraphElement
}

export function pre (options: any = {}): HTMLPreElement {
  return element('pre', options) as HTMLPreElement
}

export function ul (options: any = {}): HTMLUListElement {
  return element('ul', options) as HTMLUListElement
}

// shortcuts for creating inline text semantics elements
export function a (options: any = {}): HTMLAnchorElement {
  return element('a', options) as HTMLAnchorElement
}

export function abbr (options: any = {}): HTMLElement {
  return element('abbr', options) as HTMLElement
}

export function b (options: any = {}): HTMLElement {
  return element('b', options) as HTMLElement
}

export function bdi (options: any = {}): HTMLElement {
  return element('bdi', options) as HTMLElement
}

export function bdo (options: any = {}): HTMLElement {
  return element('bdo', options) as HTMLElement
}

export function br (options: any = {}): HTMLBRElement {
  return element('br', options) as HTMLBRElement
}

export function cite (options: any = {}): HTMLElement {
  return element('cite', options) as HTMLElement
}

export function code (options: any = {}): HTMLElement {
  return element('code', options) as HTMLElement
}

export function data (options: any = {}): HTMLDataElement {
  return element('data', options) as HTMLDataElement
}

export function dfn (options: any = {}): HTMLElement {
  return element('dfn', options) as HTMLElement
}

export function em (options: any = {}): HTMLElement {
  return element('em', options) as HTMLElement
}

export function i (options: any = {}): HTMLElement {
  return element('i', options) as HTMLElement
}

export function kbd (options: any = {}): HTMLElement {
  return element('kbd', options) as HTMLElement
}

export function mark (options: any = {}): HTMLElement {
  return element('mark', options) as HTMLElement
}

export function q (options: any = {}): HTMLQuoteElement {
  return element('q', options) as HTMLQuoteElement
}

export function rb (options: any = {}): HTMLElement {
  return element('rb', options) as HTMLElement
}

export function rp (options: any = {}): HTMLElement {
  return element('rp', options) as HTMLElement
}

export function rt (options: any = {}): HTMLElement {
  return element('rt', options) as HTMLElement
}

export function rtc (options: any = {}): HTMLElement {
  return element('rtc', options) as HTMLElement
}

export function ruby (options: any = {}): HTMLElement {
  return element('ruby', options) as HTMLElement
}

export function s (options: any = {}): HTMLElement {
  return element('s', options) as HTMLElement
}

export function samp (options: any = {}): HTMLElement {
  return element('samp', options) as HTMLElement
}

export function small (options: any = {}): HTMLElement {
  return element('small', options) as HTMLElement
}

export function span (options: any = {}): HTMLSpanElement {
  return element('span', options) as HTMLSpanElement
}

export function strong (options: any = {}): HTMLElement {
  return element('strong', options) as HTMLElement
}

export function sub (options: any = {}): HTMLElement {
  return element('sub', options) as HTMLElement
}

export function sup (options: any = {}): HTMLElement {
  return element('sup', options) as HTMLElement
}

export function time (options: any = {}): HTMLTimeElement {
  return element('time', options) as HTMLTimeElement
}

export function u (options: any = {}): HTMLElement {
  return element('u', options) as HTMLElement
}

export function _var (options: any = {}): HTMLElement {
  return element('var', options) as HTMLElement
}

export function wbr (options: any = {}): HTMLElement {
  return element('wbr', options) as HTMLElement
}

// shorthands for creating image and multimedia elements
export function area (options: any = {}): HTMLAreaElement {
  return element('area', options) as HTMLAreaElement
}

export function audio (options: any = {}): HTMLAudioElement {
  return element('audio', options) as HTMLAudioElement
}

export function img (options: any = {}): HTMLImageElement {
  return element('img', options) as HTMLImageElement
}

export function map (options: any = {}): HTMLMapElement {
  return element('map', options) as HTMLMapElement
}

export function track (options: any = {}): HTMLTrackElement {
  return element('track', options) as HTMLTrackElement
}

export function video (options: any = {}): HTMLVideoElement {
  return element('video', options) as HTMLVideoElement
}

// shorthands for creating embedded content elements
export function embed (options: any = {}): HTMLEmbedElement {
  return element('embed', options) as HTMLEmbedElement
}

export function iframe (options: any = {}): HTMLIFrameElement {
  return element('iframe', options) as HTMLIFrameElement
}

export function object (options: any = {}): HTMLObjectElement {
  return element('object', options) as HTMLObjectElement
}

export function param (options: any = {}): HTMLParamElement {
  return element('param', options) as HTMLParamElement
}

export function picture (options: any = {}): HTMLPictureElement {
  return element('picture', options) as HTMLPictureElement
}

export function source (options: any = {}): HTMLSourceElement {
  return element('source', options) as HTMLSourceElement
}

// shorthands for creating scripting elements
export function canvas (options: any = {}): HTMLCanvasElement {
  return element('canvas', options) as HTMLCanvasElement
}

export function noscript (options: any = {}): HTMLElement {
  return element('noscript', options) as HTMLElement
}

export function script (options: any = {}): HTMLScriptElement {
  return element('script', options) as HTMLScriptElement
}

// shorthands for creating demarcating edits elements
export function ins (options: any = {}): HTMLElement {
  return element('ins', options) as HTMLElement
}

export function del (options: any = {}): HTMLElement {
  return element('del', options) as HTMLElement
}

// shorthands for creating table content elements
export function caption (options: any = {}): HTMLTableCaptionElement {
  return element('caption', options) as HTMLTableCaptionElement
}

export function col (options: any = {}): HTMLTableColElement {
  return element('col', options) as HTMLTableColElement
}

export function colgroup (options: any = {}): HTMLElement {
  return element('colgroup', options) as HTMLElement
}

export function table (options: any = {}): HTMLTableElement {
  return element('table', options) as HTMLTableElement
}

export function tbody (options: any = {}): HTMLElement {
  return element('tbody', options) as HTMLElement
}

export function td (options: any = {}): HTMLTableCellElement {
  return element('td', options) as HTMLTableCellElement
}

export function tfoot (options: any = {}): HTMLElement {
  return element('tfoot', options) as HTMLElement
}

export function th (options: any = {}): HTMLTableHeaderCellElement {
  return element('th', options) as HTMLTableHeaderCellElement
}

export function thead (options: any = {}): HTMLElement {
  return element('thead', options) as HTMLElement
}

export function tr (options: any = {}): HTMLTableRowElement {
  return element('tr', options) as HTMLTableRowElement
}

// shorthands for creating forms elements
export function button (options: any = {}): HTMLButtonElement {
  return element('button', options) as HTMLButtonElement
}

export function datalist (options: any = {}): HTMLDataListElement {
  return element('datalist', options) as HTMLDataListElement
}

export function fieldset (options: any = {}): HTMLFieldSetElement {
  return element('fieldset', options) as HTMLFieldSetElement
}

export function form (options: any = {}): HTMLFormElement {
  return element('form', options) as HTMLFormElement
}

export function input (options: any = {}): HTMLInputElement {
  return element('input', options) as HTMLInputElement
}

export function label (options: any = {}): HTMLLabelElement {
  return element('label', options) as HTMLLabelElement
}

export function legend (options: any = {}): HTMLLegendElement {
  return element('legend', options) as HTMLLegendElement
}

export function meter (options: any = {}): HTMLMeterElement {
  return element('meter', options) as HTMLMeterElement
}

export function optgroup (options: any = {}): HTMLOptGroupElement {
  return element('optgroup', options) as HTMLOptGroupElement
}

export function option (options: any = {}): HTMLOptionElement {
  return element('option', options) as HTMLOptionElement
}

export function output (options: any = {}): HTMLOutputElement {
  return element('output', options) as HTMLOutputElement
}

export function progress (options: any = {}): HTMLProgressElement {
  return element('progress', options) as HTMLProgressElement
}

export function select (options: any = {}): HTMLSelectElement {
  return element('select', options) as HTMLSelectElement
}

export function textarea (options: any = {}): HTMLTextAreaElement {
  return element('textarea', options) as HTMLTextAreaElement
}

// shorthands for creating interactive elements
export function details (options: any = {}): HTMLDetailsElement {
  return element('details', options) as HTMLDetailsElement
}

export function dialog (options: any = {}): HTMLDialogElement {
  return element('dialog', options) as HTMLDialogElement
}

export function menu (options: any = {}): HTMLMenuElement {
  return element('menu', options) as HTMLMenuElement
}

export function summary (options: any = {}): HTMLElement {
  return element('summary', options) as HTMLElement
}


// shorthands for creating web components elements
export function slot (options: any = {}): HTMLSlotElement {
  return element('slot', options) as HTMLSlotElement
}

export function template (options: any = {}): HTMLTemplateElement {
  return element('template', options) as HTMLTemplateElement
}
