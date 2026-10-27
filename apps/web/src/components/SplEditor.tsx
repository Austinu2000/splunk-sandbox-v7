import { useId, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { highlightSpl, toggleSplComment } from './splEditorSyntax';
import './splEditor.css';
export function SplEditor({
  value,
  onChange,
  label = 'Search',
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null),
    highlight = useRef<HTMLDivElement>(null);
  const help = useId();
  const sync = () => {
    if (input.current && highlight.current) {
      highlight.current.scrollTop = input.current.scrollTop;
      highlight.current.scrollLeft = input.current.scrollLeft;
    }
  };
  useLayoutEffect(sync, [value]);
  function toggle() {
    const el = input.current;
    if (!el) return;
    const edit = toggleSplComment(value, el.selectionStart, el.selectionEnd);
    onChange(edit.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(edit.start, edit.end);
      sync();
    });
  }
  return (
    <div className="spl-editor-container">
      <div className="spl-editor">
        <div className="spl-editor-highlight" ref={highlight} aria-hidden="true">
          {highlightSpl(value).map((t) => (
            <span key={t.start} className={`spl-token-${t.style}`}>
              {t.text}
            </span>
          ))}
          {'\n'}
        </div>
        <textarea
          ref={input}
          className="spl-editor-input"
          value={value}
          rows={Math.min(12, Math.max(3, value.split('\n').length))}
          onChange={(e) => onChange(e.target.value)}
          onScroll={sync}
          aria-label={label}
          aria-describedby={help}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Enter SPL search…"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
              e.preventDefault();
              toggle();
              return;
            }
            if (!e.nativeEvent.isComposing) onKeyDown?.(e);
          }}
        />
      </div>
      <div className="spl-editor-help" id={help}>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={toggle}>
          Toggle comment
        </button>
        <span>
          ⌘/ or Ctrl+/ · Comments: <code>```note```</code> · Shift+Enter: new line
        </span>
      </div>
    </div>
  );
}
