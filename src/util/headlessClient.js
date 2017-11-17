/**
 * this file's centent will be insert into the page which headless Chrome open.
 * and will be exec in browser environment.
 */
// TODO: IF this file is more than 500 lines, pls split it into modules, and use
// webpack packup it.
/**
 * get the output html source code,
 * this function return a promise, and the `html` will be resolve
 */

'use strict'

const { getComputedStyle, Node } = window
const Skeleton = (function skeleton(document) {
  /**
   * constants
   */
  const IMG_COLOR = '#EFEFEF'
  const TEXT_COLOR = '#EEEEEE'
  const BUTTON_COLOR = '#EFEFEF'
  const BACK_COLOR = '#EFEFEF'
  const TRANSPARENT = 'transparent'
  const EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)/
  const GRADIENT_REG = /gradient/
  const DISPLAY_NONE = /display:\s*none/
  // 插件客户端界面的 className
  const CONSOLE_CLASS = '.sk-console'
  const PRE_REMOVE_TAGS = ['script']
  const AFTER_REMOVE_TAGS = ['title', 'meta', 'style', 'link']
  const SKELETON_STYLE = 'skeleton-style'
  const CLASS_NAME_PREFEX = 'sk-'
  // 最小 1 * 1 像素的透明 gif 图片
  const SMALLEST_BASE64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  /**
   * utils
   */
  const $$ = document.querySelectorAll.bind(document)
  const $ = document.querySelector.bind(document)
  const isBase64Img = img => /base64/.test(img.src)

  const setAttributes = (ele, attrs) => {
    Object.keys(attrs).forEach(k => ele.setAttribute(k, attrs[k]))
  }

  const genClassName = () => `${CLASS_NAME_PREFEX}${Math.random().toString(32).slice(2)}`
  const PSEUDO_CLASS = genClassName()
  const inViewPort = (ele) => {
    const rect = ele.getBoundingClientRect()
    return rect.top < window.innerHeight
      && rect.left < window.innerWidth
  }

  const checkHasPseudoEle = (ele) => {
    const hasBefore = getComputedStyle(ele, '::before').getPropertyValue('content') !== ''
    const hasAfter = getComputedStyle(ele, '::after').getPropertyValue('content') !== ''
    if (hasBefore || hasAfter) {
      return { hasBefore, hasAfter, ele }
    }
    return false
  }

  const checkHasBorder = styles => styles.getPropertyValue('border-style') !== 'none'
  const checkHasTextDecoration = styles => !/none/.test(styles.textDecorationLine)
  function imgHandler(ele) {
    const { width, height } = ele.getBoundingClientRect()
    const attrs = {
      width,
      height,
      src: SMALLEST_BASE64
    }
    setAttributes(ele, attrs)
    // DON'T put `style` attribute in attrs, becasure maybe have another inline style.
    ele.style.background = IMG_COLOR
    if (ele.hasAttribute('alt')) {
      ele.removeAttribute('alt')
    }
  }

  function textHandler(ele) {
    const { width } = ele.getBoundingClientRect()
    // 宽度小于 50 的元素就不做阴影处理
    if (width <= 50) {
      return setOpacity(ele)
    }
    const comStyle = window.getComputedStyle(ele)
    const { lineHeight, paddingTop, paddingRight, paddingBottom, position: opos, fontSize } = comStyle
    const position = ['fixed', 'absolute', 'flex'].find(p => p === opos) ? opos : 'relative'
    const height = ele.offsetHeight
    // 向下取整
    const lineCount = height / lineHeight | 0 // eslint-disable-line no-bitwise
    let textHeightRatio = parseInt(fontSize, 10) / parseInt(lineHeight, 10)
    if (Number.isNaN(textHeightRatio)) {
      textHeightRatio = 1 / 1.4
    }
    /* eslint-disable no-mixed-operators */
    Object.assign(ele.style, {
      backgroundImage: `linear-gradient(
        transparent ${(1 - textHeightRatio) / 2 * 100}%,
        ${TEXT_COLOR} 0%,
        ${TEXT_COLOR} ${((1 - textHeightRatio) / 2 + textHeightRatio) * 100}%,
        transparent 0%)`,
      backgroundSize: `100% ${lineHeight}px`,
      backgroundClip: 'content-box',
      backgroundPositionY: paddingTop,
      backgroundColor: TRANSPARENT,
      position
    })
    /* eslint-enable no-mixed-operators */
    // add white mask
    if (lineCount > 1) {
      const div = document.createElement('div')

      Object.assign(div.style, {
        width: '50%',
        height: lineHeight,
        background: '#fff',
        position: 'absolute',
        right: paddingRight,
        bottom: paddingBottom
      })

      ele.appendChild(div)
    }
  }
  /**
   * [buttonHandler 改变 button 元素样式：包括去除 border和 box-shadow, 背景色和文字颜色统一]
   */
  function buttonHandler(ele) {
    Object.assign(ele.style, {
      color: BUTTON_COLOR,
      background: BUTTON_COLOR,
      border: 'none',
      boxShadow: 'none'
    })
  }

  function backgroundImageHandler(ele) {
    ele.style.background = BACK_COLOR
  }
  /**
   * [transparent 设置元素字体颜色为透明，必要情况下，设置其 textDecorationColor 也为透明色]
   */
  function transparent(ele) {
    ele.style.color = TRANSPARENT
  }

  function setOpacity(ele) {
    ele.style.opacity = 0
  }

  function listHandle(ele) {
    const children = ele.children
    const len = children.length
    if (len === 0) return false
    const firstChild = children[0]
    // 解决有时ul元素子元素不是 li元素的 bug。
    if (firstChild.tagName !== 'LI') return listHandle(firstChild)
    Array.from(children).forEach((c, i) => {
      if (i > 0) c.parentNode.removeChild(c)
    })
    // 将 li 所有兄弟元素设置成相同的元素，保证生成的页面骨架整齐
    for (let i = 1; i < len; i++) {
      ele.appendChild(firstChild.cloneNode(true))
    }
  }

  function removeHandler(ele) {
    const parent = ele.parentNode
    if (parent) {
      parent.removeChild(ele)
    }
  }

  function emptyHandler(ele) {
    ele.innerHTML = ''
  }

  function pseudosHandler({ ele }) {
    let styleEle = $(`[data-skeleton="${SKELETON_STYLE}"]`)
    if (!styleEle) {
      styleEle = document.createElement('style')
      styleEle.setAttribute('data-skeleton', SKELETON_STYLE)
      if (document.head) {
        document.head.appendChild(styleEle)
      } else {
        document.body.appendChild(styleEle)
      }
      if (!window.createPopup) { /* For Safari */
        styleEle.appendChild(document.createTextNode(''))
      }
    }

    ele.classList.add(PSEUDO_CLASS)
    const oldHTML = styleEle.innerHTML
    if (!/content:\snone!important/.test(oldHTML)) {
      const rule = `.${PSEUDO_CLASS}::before, .${PSEUDO_CLASS}::after {content: none!important;}`
      styleEle.innerHTML = `${oldHTML}\n${rule}`
    }
  }

  function svgHandler(ele) {
    const { width, height } = ele.getBoundingClientRect()
    if (width === 0 || height === 0 || ele.getAttribute('aria-hidden') === 'true') {
      return removeHandler(ele)
    }
    emptyHandler(ele)
    setOpacity(ele)
    Object.assign(ele.style, {
      width,
      height
    })
  }

  function gradientHandler(ele) {
    ele.style.background = TRANSPARENT
  }

  function traverse(root, excludesEle) {
    const texts = []
    const buttons = []
    const hasImageBackEles = []
    const toRemove = []
    const imgs = []
    const svgs = []
    const pseudos = []
    const gradientBackEles = []
    ;(function preTraverse(ele) {
      const styles = window.getComputedStyle(ele)
      const hasPseudoEle = checkHasPseudoEle(ele)
      if (!inViewPort(ele) || DISPLAY_NONE.test(ele.getAttribute('style'))) {
        return toRemove.push(ele)
      }
      if (~excludesEle.indexOf(ele)) return false // eslint-disable-line no-bitwise

      if (hasPseudoEle) {
        pseudos.push(hasPseudoEle)
      }

      if (checkHasBorder(styles)) {
        ele.style.border = 'none'
      }

      if (ele.children.length > 0 && /UL|OL/.test(ele.tagName)) {
        listHandle(ele)
      }
      if (ele.children && ele.children.length > 0) {
        Array.from(ele.children).forEach(child => preTraverse(child))
      }

      // 将所有拥有 textChildNode 子元素的元素的文字颜色设置成背景色，这样就不会在显示文字了。
      if (ele.childNodes && Array.from(ele.childNodes).some(n => n.nodeType === Node.TEXT_NODE)) {
        transparent(ele)
      }
      if (checkHasTextDecoration(styles)) {
        ele.style.textDecorationColor = TRANSPARENT
      }
      // 隐藏所有 svg 元素
      if (ele.tagName === 'svg') {
        return svgs.push(ele)
      }
      if (EXT_REG.test(styles.background) || EXT_REG.test(styles.backgroundImage)) {
        return hasImageBackEles.push(ele)
      }
      if (GRADIENT_REG.test(styles.background) || GRADIENT_REG.test(styles.backgroundImage)) {
        return gradientBackEles.push(ele)
      }
      if (ele.tagName === 'IMG' && !isBase64Img(ele)) {
        return imgs.push(ele)
      }
      if (
        ele.nodeType === Node.ELEMENT_NODE
          && (ele.tagName === 'BUTTON' || (ele.tagName === 'A' && ele.getAttribute('role') === 'button'))
      ) {
        return buttons.push(ele)
      }
      if (
        ele.childNodes
        && ele.childNodes.length === 1
        && ele.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        return texts.push(ele)
      }
    }(root))
    svgs.forEach(e => svgHandler(e))
    toRemove.forEach(e => removeHandler(e))
    texts.forEach(e => textHandler(e))
    buttons.forEach(e => buttonHandler(e))
    hasImageBackEles.forEach(e => backgroundImageHandler(e))
    imgs.forEach(e => imgHandler(e))
    pseudos.forEach(e => pseudosHandler(e))
    gradientBackEles.forEach(e => gradientHandler(e))
  }

  function genSkeleton(remove, excludes, hide) {
    /**
     * before walk
     */
    // 将 `remove` 队列中的元素删除
    if (Array.isArray(remove)) {
      remove.push(CONSOLE_CLASS, ...PRE_REMOVE_TAGS)
      const removeEle = $$(remove.join(','))
      Array.from(removeEle).forEach(ele => removeHandler(ele))
    }
    // 将 `hide` 队列中的元素通过调节透明度为 0 来进行隐藏
    if (hide.length) {
      const hideEle = $$(hide.join(','))
      Array.from(hideEle).forEach(ele => setOpacity(ele))
    }
    /**
     * walk in process
     */
    const excludesEle = excludes.length ? Array.from($$(excludes.join(','))) : []
    const root = document.documentElement
    traverse(root, excludesEle)
  }

  function getHtmlAndStyle() {
    const root = document.documentElement
    const rawHtml = root.outerHTML
    const styles = Array.from($$('style')).map(style => style.innerHTML || style.innerText)
    Array.from($$(AFTER_REMOVE_TAGS.join(','))).forEach(ele => removeHandler(ele))
    // fix html parser can not handle `<div ubt-click=3659 ubt-data="{&quot;restaurant_id&quot;:1236835}" >`
    // need replace `&quot;` into `'`
    const cleanedHtml = document.body.innerHTML.replace(/&quot;/g, "'")
    return { rawHtml, styles, cleanedHtml }
  }

  return { genSkeleton, getHtmlAndStyle }
}(document))

window.Skeleton = Skeleton
