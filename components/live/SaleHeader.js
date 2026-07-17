import Link from 'next/link';
import { formatSaleDate } from '@/lib/live/money';

/**
 * @param {Object} props
 * @param {import('@/lib/live/types').LiveSale} props.sale
 * @param {'catalog'|'claims'|'baskets'} props.active
 */
export default function SaleHeader({ sale, active }) {
  const tabs = [
    { key: 'catalog', label: 'Catalog', href: `/admin/live/${sale.id}/catalog` },
    { key: 'claims', label: 'Run live', href: `/admin/live/${sale.id}/claims` },
    { key: 'baskets', label: 'Baskets', href: `/admin/live/${sale.id}/baskets` },
  ];

  return (
    <header className="live__head">
      <div>
        <p className="live__eyebrow">
          <Link href="/admin/live" style={{ color: 'inherit', textDecoration: 'none' }}>
            Live sales
          </Link>{' '}
          / {formatSaleDate(sale.sale_date)}
        </p>
        <h1>{sale.title || formatSaleDate(sale.sale_date)}</h1>
      </div>

      <nav className="live__nav">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`live__tab${active === tab.key ? ' live__tab--on' : ''}`}
            aria-current={active === tab.key ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
