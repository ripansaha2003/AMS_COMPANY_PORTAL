import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex items-start justify-center p-8 bg-gray-50">
      <div className="max-w-3xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-6">Last updated: November 20, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700">
            This Privacy Policy explains how EkApps collects, uses, discloses
            and protects information when you use our Service. We take your
            privacy seriously and only process personal data in accordance
            with applicable law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-gray-700">
            We collect information you provide directly (account details,
            contact information), data generated through use (logs,
            analytics), and device/browser information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
          <p className="text-gray-700">
            We use information to provide, maintain and improve the Service,
            communicate with you, and comply with legal obligations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Cookies &amp; Tracking</h2>
          <p className="text-gray-700">
            We and our partners use cookies and similar technologies to
            collect usage data and preferences. You can control cookies via
            your browser settings.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Sharing &amp; Third Parties</h2>
          <p className="text-gray-700">
            We may share information with service providers that help operate
            the Service, or where required by law. We do not sell personal
            data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Security</h2>
          <p className="text-gray-700">
            We implement reasonable technical and organizational measures to
            protect personal data. However, no method of transmission over
            the internet is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Your Rights</h2>
          <p className="text-gray-700">
            Depending on your jurisdiction you may have rights to access,
            rectify, or delete personal data. Contact us to exercise these
            rights.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">8. Contact</h2>
          <p className="text-gray-700">
            For privacy questions contact
            <a className="text-[#ED1C24] ml-1" href="mailto:privacy@ekapps.example">privacy@ekapps.example</a>.
          </p>
        </section>

        <div className="text-right">
          <Link to="/signup" className="text-sm text-gray-600 hover:underline">
            Back to Signup
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
