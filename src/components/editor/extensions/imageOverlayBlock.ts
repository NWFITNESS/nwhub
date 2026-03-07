import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageOverlayBlockView } from '../blocks/ImageOverlayBlock'

export const ImageOverlayBlock = Node.create({
  name: 'imageOverlayBlock',
  group: 'block',
  content: 'paragraph+',

  addAttributes() {
    return {
      imageUrl: { default: '' },
      overlayOpacity: { default: 'medium' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.layout-overlay',
        getAttrs(node) {
          const el = node as HTMLElement
          const bgImage = el.style.backgroundImage
          const imageUrl = bgImage ? bgImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1') : ''
          return {
            imageUrl,
            overlayOpacity: el.dataset.opacity ?? 'medium',
          }
        },
        contentElement: '.layout-overlay__content',
      },
    ]
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHTML({ node }): any {
    const style = node.attrs.imageUrl
      ? `background-image:url(${node.attrs.imageUrl});background-size:cover;background-position:center`
      : ''
    return [
      'div',
      {
        class: 'layout-overlay',
        'data-opacity': node.attrs.overlayOpacity,
        style,
      },
      ['div', { class: 'layout-overlay__content' }, 0],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageOverlayBlockView)
  },
})
