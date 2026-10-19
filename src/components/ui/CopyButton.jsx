import { useState } from 'react';
import { Button } from './Button.jsx';

export function CopyButton({ value, label = 'Copy', size = 'sm' }) {
  const [state, setState] = useState('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2000);
  }

  const text = { idle: label, copied: 'Copied', failed: 'Copy failed' }[state];
  return (
    <Button variant="secondary" size={size} onClick={copy} aria-live="polite">
      {text}
    </Button>
  );
}
