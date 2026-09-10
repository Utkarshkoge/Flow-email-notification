import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

const FEATURES = [
  { emoji: "📬", title: "Instant Email Alerts", desc: "Get a formatted email the moment any Shopify webhook fires — orders, products, customers and more." },
  { emoji: "🧩", title: "Metaobject Logging", desc: "Every event is stored as a Shopify Metaobject, giving you a searchable 30-day audit trail." },
  { emoji: "⚡", title: "Shopify Flow Powered", desc: "Works natively with Shopify Flow — no third-party email service or API keys to manage." },
  { emoji: "🎛️", title: "Granular Filters", desc: "Pick exactly which resource types trigger emails. Everything else is silently skipped." },
  { emoji: "🔍", title: "Rich Event Inspector", desc: "Browse logs with filters, pagination, and a full JSON payload viewer inside Shopify Admin." },
  { emoji: "🛡️", title: "Zero Setup Security", desc: "All access is authenticated via Shopify OAuth — install and you're protected immediately." },
];

const STEPS = [
  { num: "1", title: "Install the App", desc: "Add it to your Shopify store." },
  { num: "2", title: "Create Metaobject", desc: "Initialize log storage from the Event Logs page." },
  { num: "3", title: "Set Up Flow", desc: "Connect the trigger to your email action in Shopify Flow." },
  { num: "4", title: "Choose Resource Types", desc: "Select which events should fire emails." },
  { num: "5", title: "Done!", desc: "Emails arrive automatically every time an event fires." },
];

export default function LandingPage() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.page}>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navBrand}>
          <span className={styles.navLogo}>📧</span>
          <span className={styles.navTitle}>Flow Email Notification</span>
        </a>
        <span className={styles.navBadge}>Shopify App</span>
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroHeading}>
            Real-time email alerts<br />for every store event
          </h1>
          <p className={styles.heroSub}>
            Flow Email Notification captures every Shopify webhook, logs it as a Metaobject,
            and sends a formatted email through Shopify Flow — automatically, every time.
          </p>

          {showForm && (
            <div className={styles.loginCard}>
              <Form method="post" action="/auth/login">
                <label className={styles.loginLabel}>
                  Enter your store URL to open the app
                </label>
                <div className={styles.inputRow}>
                  <input
                    id="shop-url"
                    className={styles.storeInput}
                    type="text"
                    name="shop"
                    placeholder="your-store.myshopify.com"
                    autoComplete="off"
                    autoFocus
                  />
                  <button className={styles.loginBtn} type="submit">
                    Open App
                  </button>
                </div>
                <p className={styles.inputHint}>e.g. my-shop.myshopify.com</p>
              </Form>
            </div>
          )}
        </section>

        {/* Features */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What's included</h2>
          <p className={styles.sectionSub}>Everything built in — nothing to configure externally.</p>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.emoji}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          © {new Date().getFullYear()} Flow Email Notification · Built for Shopify
        </span>
      </footer>

    </div>
  );
}
