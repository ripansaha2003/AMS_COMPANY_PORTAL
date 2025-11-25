import React from "react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen flex items-start justify-center p-8 bg-gray-50">
      <div className="max-w-3xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-6">Last updated: November 20, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700">
            Welcome to EkApps. These Terms of Service ("Terms") govern your use
            of our websites, web applications and services (collectively,
            "Service"). By accessing or using the Service you accept and agree
            to be bound by these Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Using the Service</h2>
          <p className="text-gray-700">
            You agree to use the Service only for lawful purposes and in
            compliance with all applicable laws. You are responsible for all
            activity under your account and for keeping your credentials
            secure.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Accounts and Registration</h2>
          <p className="text-gray-700">
            When you create an account you must provide accurate information.
            We may suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Intellectual Property</h2>
          <p className="text-gray-700">
            The Service and its original content, features and functionality are
            and will remain the exclusive property of EkApps and its licensors.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Limitation of Liability</h2>
          <p className="text-gray-700">
            To the maximum extent permitted by law, EkApps will not be liable
            for indirect, incidental, special, consequential or punitive
            damages arising out of your use of the Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Changes to Terms</h2>
          <p className="text-gray-700">
            We may modify these Terms from time to time. When we do, we will
            update the "Last updated" date. Continued use of the Service after
            changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
          <p className="text-gray-700">
            If you have questions about these Terms, contact us at
            <a className="text-[#ED1C24] ml-1" href="mailto:support@ekapps.example">support@ekapps.example</a>.
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

export default Terms;
