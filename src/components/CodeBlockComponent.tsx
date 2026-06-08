import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
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

export default function CodeBlockComponent({ node, updateAttributes, extension }: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <NodeViewWrapper className="code-block my-6 relative bg-[#1E1E1E] rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-[#3D3D3D]">
        <select
          contentEditable={false}
          value={node.attrs.language || 'javascript'}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="bg-transparent text-slate-300 text-xs font-mono outline-none cursor-pointer hover:text-white transition-colors"
        >
          <option value="null">auto</option>
          <option disabled>—</option>
          {LANGUAGES.map((lang, index) => (
            <option key={index} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono text-slate-50 min-h-[100px]">
        {/* We use NodeViewContent for the actual content so TipTap syncs it properly */}
        <pre className="!bg-transparent !p-0 !m-0 outline-none"><NodeViewContent as="code" /></pre>
      </div>
    </NodeViewWrapper>
  );
}
