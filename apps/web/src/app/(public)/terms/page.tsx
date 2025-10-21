export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Agreement to Terms</h2>
            <p className="text-gray-600">
              By accessing and using the Enterprise Educational Platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Use License</h2>
            <p className="text-gray-600 mb-2">
              Permission is granted to temporarily access the materials on our platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to reverse engineer any software contained on the platform</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person or mirror the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">User Accounts</h2>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Acceptable Use</h2>
            <p className="text-gray-600 mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Use the platform in any way that violates applicable laws or regulations</li>
              <li>Impersonate or attempt to impersonate another user</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the platform</li>
              <li>Upload or transmit viruses or any other type of malicious code</li>
              <li>Attempt to gain unauthorized access to any portion of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Intellectual Property</h2>
            <p className="text-gray-600">
              The platform and its original content, features, and functionality are owned by the Enterprise Educational Platform and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Limitation of Liability</h2>
            <p className="text-gray-600">
              In no event shall the Enterprise Educational Platform or its suppliers be liable for any damages arising out of the use or inability to use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify or replace these terms at any time. It is your responsibility to check these terms periodically for changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact Information</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms, please contact us at terms@eduplatform.com
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
