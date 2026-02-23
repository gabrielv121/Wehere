import { Link, useParams } from 'react-router-dom';

const LEGAL_PAGES: Record<string, { title: string; content: React.ReactNode }> = {
  terms: {
    title: 'Terms of Service',
    content: (
      <>
        <p>By using WeHere, users agree to comply with all marketplace rules and applicable laws.</p>
        <p>WeHere operates as a fan-to-fan resale platform and is not the primary ticket issuer. Sellers are responsible for listing accurate ticket information.</p>
        <p>WeHere may suspend accounts, remove listings, or cancel transactions that violate platform policies.</p>
        <p className="text-slate-500 text-xs mt-6">This is an MVP version. For production launch, have these terms reviewed by a lawyer.</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <>
        <p>WeHere collects limited personal information necessary to operate the platform, including account details, payment processing data, and transaction history.</p>
        <p>We do not sell personal data to advertisers. Information is used solely to provide marketplace services, improve user experience, and ensure transaction security.</p>
      </>
    ),
  },
  cookies: {
    title: 'Cookie Policy',
    content: (
      <>
        <p>WeHere uses cookies to remember user preferences, analyze traffic, and improve performance.</p>
        <p>Users may disable cookies through their browser settings, though some features may not function properly.</p>
      </>
    ),
  },
  disclaimer: {
    title: 'Disclaimer',
    content: (
      <>
        <p>WeHere is an independent resale marketplace. Ticket availability and pricing are determined by individual sellers, not by venues, artists, or event organizers.</p>
        <p>WeHere is not affiliated with or endorsed by any venue, team, or performer unless explicitly stated.</p>
      </>
    ),
  },
  refund: {
    title: 'Refunds Policy',
    content: (
      <>
        <p>All ticket sales are generally final. Refunds may be issued if:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>An event is canceled.</li>
          <li>Tickets are invalid or not delivered.</li>
          <li>A seller fails to complete the transfer.</li>
        </ul>
        <p className="mt-4">If an event is postponed, tickets remain valid for the new date unless otherwise stated.</p>
      </>
    ),
  },
};

export function Legal() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? LEGAL_PAGES[slug] : null;

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Page not found.</p>
        <Link to="/" className="mt-4 inline-block text-teal-600 font-medium hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{page.title}</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        {page.content}
      </div>
    </div>
  );
}
