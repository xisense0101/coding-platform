export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Introduction</h2>
            <p className="text-gray-600">
              Welcome to our Enterprise Educational Platform. We are committed to protecting your personal information and your right to privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
            <p className="text-gray-600 mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Name and contact information</li>
              <li>Account credentials</li>
              <li>Educational records and performance data</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">How We Use Your Information</h2>
            <p className="text-gray-600 mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and manage your account</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your Rights</h2>
            <p className="text-gray-600 mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at privacy@eduplatform.com
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: October 21, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
