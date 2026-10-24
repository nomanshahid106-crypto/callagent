import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="mark">📞</span>
      <span>CallAgent</span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="container inner">
        <Logo />
        <nav className="nav">
          <Link href="/#agents">Agents</Link>
          <Link href="/#how">How It Works</Link>
          <Link href="/#pricing">Pricing</Link>
        </nav>
        <div className="header-right">
          <span className="badge demo">Demo Mode</span>
          <Link href="/login" className="btn ghost sm">
            Sign In
          </Link>
          <Link href="/#agents" className="btn sm">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div>
          <Logo />
          <p className="small" style={{ maxWidth: 320, marginTop: 10 }}>
            AI call agents that call your list for you — and hand you back a
            summary and result for every single call.
          </p>
        </div>
        <div>
          <strong>Product</strong>
          <p className="small" style={{ marginTop: 8 }}>
            <Link href="/#agents">Choose Your Agent</Link>
            <br />
            <Link href="/#pricing">Pricing</Link>
            <br />
            <Link href="/login">Sign In</Link>
          </p>
        </div>
        <div>
          <strong>Payments</strong>
          <p className="small" style={{ marginTop: 8 }}>
            Subscriptions are billed securely by <strong>Paddle</strong>, our
            Merchant of Record.
            <br />
            Prices in USD. Cancel anytime.
          </p>
        </div>
      </div>
      <div className="container small" style={{ marginTop: 24 }}>
        © {new Date().getFullYear()} CallAgent. Demo build — calls, accounts
        and payments on this deployment run in demo/sandbox mode until the
        production integrations are connected.
      </div>
    </footer>
  );
}
