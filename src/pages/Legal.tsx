import { Link, useParams } from 'react-router-dom';

const LEGAL_PAGES: Record<string, { title: string }> = {
  terms: { title: 'Terms of Service' },
  privacy: { title: 'Privacy Policy' },
  refund: { title: 'Refund Policy' },
  cookies: { title: 'Cookie Policy' },
  disclaimer: { title: 'Disclaimer' },
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
      <div className="prose prose-slate text-slate-600 text-sm">
        <p>
          This is a placeholder for the {page.title.toLowerCase()}. Add your full legal content here.
        </p>
        <p className="mt-4">
          WeHere is a demo project. In production, you would include the complete terms, privacy policy,
          refund policy, and disclaimer as required by your jurisdiction.
        </p>
      </div>
    </div>
  );
}
