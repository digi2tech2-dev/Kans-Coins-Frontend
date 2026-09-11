import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Check, Copy, ExternalLink, Menu } from 'lucide-react';
import brandLogo from '../assets/logo.PNG';

const configuredB2bApiBase = String(import.meta.env.VITE_B2B_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

const backendOrigin = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

// VITE_B2B_API_BASE_URL is already the full canonical B2B base. The fallback
// derives the backend origin from the normal /api frontend base exactly once.
const apiBaseUrl = configuredB2bApiBase || backendOrigin + '/client/api' || '/client/api';

const navigation = [
  ['introduction', 'Introduction'],
  ['base-url', 'Base URL'],
  ['authentication', 'Authentication'],
  ['profile', 'Profile'],
  ['products', 'Products'],
  ['product-fields', 'Product Fields'],
  ['content', 'Content / Categories'],
  ['create-order', 'Create Order'],
  ['check-orders', 'Check Orders'],
  ['status-values', 'Status Values'],
  ['errors', 'Error Codes'],
  ['code-examples', 'Code Examples'],
  ['legacy', 'Legacy Compatibility'],
];

const CopyButton = ({ value, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Content remains selectable if the browser denies clipboard access.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 font-semibold text-slate-200 transition hover:border-violet-300/60 hover:bg-violet-300/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/70 ' + (compact ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm')}
      aria-label={'Copy ' + value}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const CodeBlock = ({ children, label = 'Example' }) => {
  const value = String(children).trim();

  return (
    <div dir="ltr" className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#090b16] text-left shadow-inner shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-900/70 px-3 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <CopyButton value={value} compact />
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-left font-mono text-xs leading-6 text-slate-100 [direction:ltr] sm:text-[13px]"><code>{value}</code></pre>
    </div>
  );
};

const EndpointCard = ({ method, path, description, children }) => (
  <article className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/40">
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/70 bg-slate-900/50 px-4 py-3">
      <span className={'rounded-md px-2 py-1 font-mono text-xs font-bold tracking-wide ' + (method === 'POST' ? 'bg-violet-500/20 text-violet-200' : 'bg-emerald-500/15 text-emerald-200')}>{method}</span>
      <code className="min-w-0 break-all font-mono text-sm font-semibold text-white [direction:ltr]">{path}</code>
    </div>
    <div className="space-y-4 p-4">
      {description && <p className="text-sm leading-6 text-slate-300">{description}</p>}
      {children}
    </div>
  </article>
);

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 rounded-2xl border border-slate-700/70 bg-[#121021] p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:p-7">
    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
    <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">{children}</div>
  </section>
);

const DocsNavigation = ({ activeSection, onNavigate, mobile = false }) => (
  <nav aria-label="API documentation sections" className={mobile ? 'grid gap-1 p-3' : 'space-y-1'}>
    {navigation.map(([id, label]) => (
      <a
        key={id}
        href={'#' + id}
        onClick={onNavigate}
        className={'block rounded-lg px-3 py-2 text-sm transition ' + (activeSection === id ? 'bg-violet-400/15 font-semibold text-violet-100' : 'text-slate-400 hover:bg-white/5 hover:text-white')}
      >
        {label}
      </a>
    ))}
  </nav>
);

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries.find((entry) => entry.isIntersecting);
        if (visibleSection) setActiveSection(visibleSection.target.id);
      },
      { rootMargin: '-18% 0px -72% 0px', threshold: 0 },
    );

    navigation.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const closeMobileNavigation = (event) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
  };

  return (
    <main dir="ltr" className="min-h-screen bg-[#090713] text-left text-slate-100 [direction:ltr]">
      <header className="sticky top-0 z-40 border-b border-violet-200/10 bg-[#0d0a18]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Kanz Coins home">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-violet-200/20 bg-violet-200/10">
              <img src={brandLogo} alt="Kanz Coins" className="h-7 w-7 object-contain" />
            </span>
            <span className="truncate text-sm font-bold tracking-wide text-white sm:text-base">API Documentation</span>
          </Link>
          <Link
            to="/developers/api"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-300/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/20 sm:text-sm"
          >
            API Management <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <details className="mb-5 rounded-xl border border-slate-700/70 bg-[#121021] lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <Menu className="h-4 w-4 text-violet-200" /> Browse sections
          </summary>
          <div className="border-t border-slate-700/70">
            <DocsNavigation activeSection={activeSection} onNavigate={closeMobileNavigation} mobile />
          </div>
        </details>

        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-slate-700/70 bg-[#121021]/80 p-3">
              <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">On this page</p>
              <DocsNavigation activeSection={activeSection} onNavigate={() => {}} />
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-violet-300/20 bg-[#151126] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-200"><BookOpen className="h-4 w-4" /> Canonical B2B API v1</div>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">Integrate once across every Kanz Coins site.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Only the base URL and API token change between sites. Prices, wallet validation, order lifecycle, and status values are always decided by the server.</p>
              <div className="mt-6 rounded-xl border border-slate-700/80 bg-[#090b16] p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Base URL</p>
                  <code className="block overflow-x-auto whitespace-nowrap font-mono text-sm text-violet-100 [direction:ltr]">{apiBaseUrl}</code>
                </div>
                <div className="mt-3 sm:mt-0"><CopyButton value={apiBaseUrl} /></div>
              </div>
            </section>

            <Section id="introduction" title="Introduction">
              <p>All canonical endpoints use numeric compatibility IDs. Do not use MongoDB IDs in B2B integrations.</p>
            </Section>

            <Section id="base-url" title="Base URL">
              <p>Use this canonical base URL for every B2B request. It already includes <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-slate-100">/client/api</code>.</p>
              <CodeBlock label="Canonical base URL">{apiBaseUrl}</CodeBlock>
            </Section>

            <Section id="authentication" title="Authentication">
              <p>Send the canonical header on every request:</p>
              <CodeBlock label="Request header">api-token: YOUR_API_TOKEN</CodeBlock>
              <p>Legacy aliases remain accepted: <code className="font-mono text-slate-100">x-api-key</code> and <code className="font-mono text-slate-100">Authorization: Bearer YOUR_API_TOKEN</code>.</p>
            </Section>

            <Section id="profile" title="Profile">
              <EndpointCard method="GET" path="/profile" description="Returns the authenticated account’s currently spendable balance and account currency.">
                <CodeBlock label="Request">{'GET ' + apiBaseUrl + '/profile\napi-token: YOUR_API_TOKEN'}</CodeBlock>
                <CodeBlock label="Response example">{'{\n  "balance": "150",\n  "email": "user@example.com",\n  "currency": "USD"\n}'}</CodeBlock>
              </EndpointCard>
              <p><code className="font-mono text-slate-100">balance</code> is the currently spendable balance, including available credit under the account’s existing wallet rules.</p>
            </Section>

            <Section id="products" title="Products">
              <EndpointCard method="GET" path="/products" description="Lists products available to the authenticated reseller. Filter an existing set with products_id when needed.">
                <CodeBlock label="Request">{'GET ' + apiBaseUrl + '/products\nGET ' + apiBaseUrl + '/products?products_id=1000,1001\nGET ' + apiBaseUrl + '/products?base=1'}</CodeBlock>
                <CodeBlock label="Response example">{'{\n  "id": 1000,\n  "name": "PUBG Mobile UC 60",\n  "price": 1.5,\n  "currency": "USD",\n  "available": true,\n  "product_type": "package",\n  "parent_id": 7,\n  "category_name": "PUBG",\n  "category_img": "uploads/categories/pubg.png",\n  "qty_values": null,\n  "params": ["Player ID"]\n}'}</CodeBlock>
              </EndpointCard>
            </Section>

            <Section id="product-fields" title="Product Fields">
              <p><code className="font-mono text-slate-100">fields</code> is canonical structured input metadata. <code className="font-mono text-slate-100">params</code> remains the legacy label-only list. Fixed/package products use <code className="font-mono text-slate-100">qty_values: null</code>; range products expose their existing min/max range.</p>
              <CodeBlock label="Structured fields">{'"fields": [\n  {\n    "key": "player_id",\n    "label": "Player ID",\n    "type": "text",\n    "required": true,\n    "options": []\n  }\n]'}</CodeBlock>
            </Section>

            <Section id="content" title="Content / Categories">
              <EndpointCard method="GET" path="/content/:parentId" description="Returns categories and products below a numeric compatibility category ID. Use 0 for root content.">
                <CodeBlock label="Request">{'GET ' + apiBaseUrl + '/content/0\nGET ' + apiBaseUrl + '/content/:parentId'}</CodeBlock>
                <CodeBlock label="Response envelope">{'{\n  "status": "OK",\n  "data": {\n    "categories": [],\n    "products": []\n  }\n}'}</CodeBlock>
              </EndpointCard>
              <p>Category IDs and product IDs are numeric compatibility IDs.</p>
            </Section>

            <Section id="create-order" title="Create Order">
              <EndpointCard method="POST" path="/orders" description="Creates an order using the existing server-side pricing, wallet, validation, provider, and idempotency flow.">
                <CodeBlock label="Request">{'POST ' + apiBaseUrl + '/orders\napi-token: YOUR_API_TOKEN\nContent-Type: application/json\n\n{\n  "product_id": 1000,\n  "qty": 1,\n  "order_uuid": "client-generated-idempotency-key",\n  "params": { "player_id": "123456789", "server": "EU" }\n}'}</CodeBlock>
                <CodeBlock label="Response example">{'{\n  "status": "OK",\n  "data": {\n    "order_id": "ID_...",\n    "order_uuid": "client-generated-idempotency-key",\n    "status": "wait",\n    "price": 1.26048,\n    "currency": "USD",\n    "data": { "player_id": "123456789", "server": "EU" },\n    "replay_api": null\n  }\n}'}</CodeBlock>
              </EndpointCard>
              <p><code className="font-mono text-slate-100">order_uuid</code> is required and idempotent per authenticated account. Repeating it returns the original order without another debit.</p>
            </Section>

            <Section id="check-orders" title="Check Orders">
              <EndpointCard method="GET" path="/check" description="Looks up only orders owned by the authenticated API account.">
                <CodeBlock label="Request">{'GET ' + apiBaseUrl + '/check?orders=ID_1,ID_2\nGET ' + apiBaseUrl + '/check?orders=uuid1,uuid2&uuid=1\nGET ' + apiBaseUrl + '/check?uuids=uuid1,uuid2'}</CodeBlock>
              </EndpointCard>
            </Section>

            <Section id="status-values" title="Status Values">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['accept', 'Completed'],
                  ['wait', 'Pending, processing, manual review, partial, or another in-flight state'],
                  ['reject', 'Failed or canceled'],
                ].map(([status, meaning]) => (
                  <div key={status} className="rounded-xl border border-slate-700/70 bg-slate-950/35 p-4">
                    <code className="font-mono font-bold text-violet-100">{status}</code>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{meaning}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="errors" title="Error Codes">
              <CodeBlock label="Compatibility error codes">{'100 insufficient balance   105 quantity unavailable   106 invalid quantity\n109 product not found      110 product unavailable    111 rate limited\n112 too small              113 too large              114 business/order error\n120 token required         121 invalid token          122 API disabled/inactive\n123 IP not allowed          124 validation error        130 maintenance\n500 internal server error'}</CodeBlock>
            </Section>

            <Section id="code-examples" title="Code Examples">
              <CodeBlock label="cURL">{'curl -X POST ' + apiBaseUrl + '/orders \\\n  -H "api-token: YOUR_API_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\"product_id\":1000,\"qty\":1,\"order_uuid\":\"uuid-1\",\"params\":{\"player_id\":\"123\"}}\''}</CodeBlock>
              <CodeBlock label="JavaScript">{'await fetch("' + apiBaseUrl + '/orders", {\n  method: "POST",\n  headers: { "api-token": "YOUR_API_TOKEN", "Content-Type": "application/json" },\n  body: JSON.stringify(payload),\n});'}</CodeBlock>
              <CodeBlock label="Python">{'requests.post(\n  "' + apiBaseUrl + '/orders",\n  headers={"api-token": "YOUR_API_TOKEN"},\n  json=payload,\n)'}</CodeBlock>
              <CodeBlock label="PHP">{'$client->post("' + apiBaseUrl + '/orders", [\n  "headers" => ["api-token" => "YOUR_API_TOKEN"],\n  "json" => $payload,\n]);'}</CodeBlock>
            </Section>

            <Section id="legacy" title="Legacy Compatibility">
              <p><code className="font-mono text-slate-100">GET /newOrder/:productId/params</code> remains available for existing integrations. New integrations should use POST <code className="font-mono text-slate-100">/orders</code>. The aliases <code className="font-mono text-slate-100">/api/client/api</code>, <code className="font-mono text-slate-100">/api/v1/reseller</code>, and <code className="font-mono text-slate-100">/api/client</code> remain supported according to their existing contracts.</p>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ApiDocs;
