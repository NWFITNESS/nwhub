import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TwoColumnBlockView } from '../blocks/TwoColumnBlock'

export const TwoColumnBlock = Node.create({
  name: 'twoColumnBlock',
  group: 'block',
  content: 'paragraph+',

  addAttributes() {
    return {
      imageUrl: { default: '' },
      imageAlt: { default: '' },
      layout: { default: '50/50' },
      imagePosition: { default: 'right' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.layout-col',
        getAttrs(node) {
          const el = node as HTMLElement
          return {
            layout: el.dataset.layout ?? '50/50',
            imagePosition: el.dataset.imgPos ?? 'right',
            imageUrl: el.dataset.imageUrl ?? '',
            imageAlt: el.dataset.imageAlt ?? '',
          }
        },
        contentElement: '.layout-col__text',
      },
    ]
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHTML({ node }): any {
    return [
      'div',
      {
        class: 'layout-col',
        'data-layout': node.attrs.layout,
        'data-img-pos': node.attrs.imagePosition,
        'data-image-url': node.attrs.imageUrl,
        'data-image-alt': node.attrs.imageAlt,
      },
      ['div', { class: 'layout-col__text' }, 0],
      node.attrs.imageUrl
        ? ['div', { class: 'layout-col__image' }, ['img', { src: node.attrs.imageUrl, alt: node.attrs.imageAlt ?? '' }]]
        : ['div', { class: 'layout-col__image' }],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TwoColumnBlockView)
  },
})
