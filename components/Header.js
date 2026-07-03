import LanguageSelector from "@/components/LanguageSelector";

export default function Header() {
  return (
    <header className="header customerOnlyHeader">
      <a className="brand" href="/">
        <img src="/logo2.png" alt="Erendira's Boutique" />
        <span className="brandText">
          <strong>Erendira&apos;s Boutique</strong>
          <span>
            <span className="lang-en">Ships every Saturday</span>
            <span className="lang-es">Envios cada Sábado</span>
          </span>
        </span>
      </a>
      <nav className="nav">
        <LanguageSelector />
        <a className="primary" href="https://www.erendirasboutique.com/shop" target="_blank" rel="noreferrer">
          <span className="lang-en">Shop</span>
          <span className="lang-es">Comprar</span>
        </a>
      </nav>
    </header>
  );
}
