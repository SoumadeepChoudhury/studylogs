import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
];

export default function MonacoCodeBlock({ node, updateAttributes }: NodeViewProps) {
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      updateAttributes({ content: value });
    }
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="my-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-[#fafafa]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <select
          contentEditable={false}
          value={node.attrs.language || 'javascript'}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="bg-transparent text-slate-700 text-xs font-mono outline-none cursor-pointer focus:outline-none"
        >
          {LANGUAGES.map((lang, index) => (
            <option key={index} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className="h-[300px] w-full" contentEditable={false}>
        <Editor
          height="100%"
          language={node.attrs.language || 'javascript'}
          theme="light"
          value={node.attrs.content || ''}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1.6,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            formatOnType: false,
            wordWrap: 'on',
            // Disable error squiggles (diagnostics)
            // Note: In monaco, validation is language specific. But since it's hard to modify workers via generic props easily, 
            // We can disable syntactic validation using beforeMount or standard options.
          }}
          beforeMount={(monaco) => {
            // Disable syntax and semantic errors for typescript/javascript
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
            });
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
            });
            // Disable JSON validation
            if (monaco.languages.json && monaco.languages.json.jsonDefaults) {
               monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                  validate: false,
               });
            }
            if (monaco.languages.css && monaco.languages.css.cssDefaults) {
               monaco.languages.css.cssDefaults.setDiagnosticsOptions({
                  validate: false,
               });
            }
            if (monaco.languages.html && monaco.languages.html.htmlDefaults) {
               monaco.languages.html.htmlDefaults.setOptions({ format: false });
            }
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}
