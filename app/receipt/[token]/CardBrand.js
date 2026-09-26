'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * Shows the card network's logo from /public/card-brands/<brand>.svg
 * (visa.svg, mastercard.svg, amex.svg, discover.svg, jcb.svg, diners.svg, unionpay.svg).
 * If that file isn't there, it falls back to the brand name in text.
 */

const FILES = {
  VISA: 'visa',
  MC: 'mastercard',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  AMERICAN_EXPRESS: 'amex',
  DISCOVER: 'discover',
  JCB: 'jcb',
  DINERS: 'diners',
  DINERS_CLUB: 'diners',
  UNIONPAY: 'unionpay',
};

export default function CardBrand(props) {
  const key = String(props.brand || '').toUpperCase().replace(/\s+/g, '_');
  const file = FILES[key];
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // If the file was already missing before the page's scripts loaded,
  // the error event was missed, so check once after load.
  useEffect(function () {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!file || failed) return <span>{props.label}</span>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={'/card-brands/' + file + '.svg'}
      alt={props.label}
      title={props.label}
      className="rcpt-brand"
      onError={function () { setFailed(true); }}
    />
  );
}
