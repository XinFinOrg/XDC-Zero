const Footer = () => {
  return (
    <footer className="footer p-10">
      <aside>
        <p>
          XDC Zero
          <br />
          Advanced Cross-Chain System
        </p>
      </aside>
      <nav>
        <header className="footer-title">Services</header>
        <a
          className="link link-hover"
          href="https://github.com/XinFinOrg/XDC-Zero"
          target="_blank"
        >
          Gihutb
        </a>
        <a
          className="link link-hover"
          href="https://t.me/xdczero"
          target="_blank"
        >
          Telegram
        </a>
      </nav>
      <nav>
        <header className="footer-title">Company</header>
        <a className="link link-hover">About us</a>
      </nav>
      <nav>
        <header className="footer-title">Legal</header>
        <a className="link link-hover">Terms of use</a>
        <a className="link link-hover">Privacy policy</a>
        <a className="link link-hover">Cookie policy</a>
      </nav>
    </footer>
  );
};

export default Footer;
