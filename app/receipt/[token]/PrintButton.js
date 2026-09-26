'use client';

export default function PrintButton(props) {
  return (
    <button type="button" className="rcpt-btn" onClick={function () { window.print(); }}>
      {props.label}
    </button>
  );
}
