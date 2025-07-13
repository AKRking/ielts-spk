import React, { useMemo } from 'react'; // Import useMemo
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your text...",
  className = "",
}) => {
  // Use useMemo to prevent the modules object from being recreated on every render
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote'],
      [{ 'background': ['yellow'] }], 
      ['clean']
    ],
    // --- IMPLEMENTATION START: Keyboard Shortcut ---
    keyboard: {
      bindings: {
        // We'll name our binding 'highlight'. The name is arbitrary.
        highlight: {
          key: 'H',
          shortKey: true, // This maps to Cmd on Mac and Ctrl on Windows/Linux
          
          // The handler function to execute when the shortcut is pressed
          handler: function(range, context) {
            // `this.quill` is the Quill editor instance
            
            // 1. Do nothing if there's no text selected
            if (range.length === 0) {
              return true; // Let the event bubble up
            }

            // 2. Check if the selected text is already highlighted
            const isAlreadyHighlighted = context.format.background === 'yellow';

            // 3. Toggle the 'yellow' background format on the selected text
            this.quill.formatText(range.index, range.length, 'background', isAlreadyHighlighted ? false : 'yellow');

            return false; // We've handled it, so don't let it bubble
          }
        }
      }
    }
    // --- IMPLEMENTATION END ---
  }), []); // The empty dependency array ensures this object is created only once

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'blockquote',
    'background'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
        }}
      />
      <style jsx global>{`
        /* ... (all your existing styles remain the same) ... */
        .rich-text-editor .ql-editor {
          min-height: 150px;
          font-size: 16px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-color: #d1d5db;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-color: #d1d5db;
          font-family: inherit;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-text-editor .ql-editor strong { font-weight: 600; }
        .rich-text-editor .ql-editor h1 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0; }
        .rich-text-editor .ql-editor h2 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0; }
        .rich-text-editor .ql-editor h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        .rich-text-editor .ql-editor ul, 
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }
        .rich-text-editor .ql-editor li { margin: 0.25em 0; }
        .rich-text-editor .ql-editor .ql-bg-yellow {
          background-color: #fef9c3;
          color: #713f12;
          padding: 0.1em 0.2em;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};