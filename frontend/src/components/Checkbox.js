import React, { useState } from 'react';
import { useT } from '../theme';

export function Checkbox({ id, completed, onToggle }) {
  const T = useT();
  const [pop, setPop] = useState(false);

  const handle = () => {
    if (!completed) { setPop(true); setTimeout(() => setPop(false), 260); }
    onToggle(id, completed);
  };

  return (
    <button
      onClick={handle}
      className={pop ? 'check-pop' : ''}
      style={{
        width: 15, height: 15,
        border: `1px solid ${completed ? T.red : T.rule}`,
        background: completed ? T.red : 'transparent',
        cursor: 'pointer', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: T.paper, fontSize: 9,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >{completed ? '✓' : ''}</button>
  );
}
