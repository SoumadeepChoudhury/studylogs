import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MonacoCodeBlock from '../components/MonacoCodeBlock';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    monacoCodeBlock: {
      setMonacoCodeBlock: (attributes?: any) => ReturnType;
      toggleMonacoCodeBlock: (attributes?: any) => ReturnType;
    }
  }
}

export const MonacoCodeBlockExtension = Node.create({
  name: 'monacoCodeBlock',

  group: 'block',

  content: 'text*',

  marks: '',

  code: true,

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      language: {
        default: 'javascript',
        parseHTML: element => element.getAttribute('data-language'),
        renderHTML: attributes => {
          return {
            'data-language': attributes.language,
          }
        },
      },
      content: {
        default: '',
        parseHTML: element => element.textContent,
        renderHTML: attributes => {
           // We don't render content attribute to DOM, we render it as text
           return {}
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="monaco-code-block"]',
      },
      // support legacy pre/code
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        'code',
        {
          class: node.attrs.language
            ? `language-${node.attrs.language}`
            : 'language-javascript',
        },
        node.attrs.content || ''
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MonacoCodeBlock)
  },
  
  addCommands() {
    return {
      setMonacoCodeBlock:
        attributes =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes)
        },
      toggleMonacoCodeBlock:
        attributes =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', attributes)
        },
    }
  },
})
