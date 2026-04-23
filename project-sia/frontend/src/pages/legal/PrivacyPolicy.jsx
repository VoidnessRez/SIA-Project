import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero legal-privacy">
        <h1>Privacy Policy</h1>
        <p>Effective Date: April 13, 2026</p>
      </section>

      <main className="legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect personal data you provide during account creation, checkout, and
            support requests, such as name, contact details, address, and order history.
          </p>
        </section>

        <section>
          <h2>2. How We Use Data</h2>
          <p>
            Your data is used to process orders, verify payments, support delivery,
            improve service quality, and provide account-related notifications.
          </p>
        </section>

        <section>
          <h2>3. Payment Data</h2>
          <p>
            Payment proof files submitted for verification are processed for fraud
            prevention and order confirmation purposes.
          </p>
        </section>

        <section>
          <h2>4. Data Sharing</h2>
          <p>
            We do not sell personal information. We may share necessary details with
            logistics, payment, or technical service providers strictly for operations.
          </p>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We apply reasonable security controls, but no online system is guaranteed
            100% secure. Users should also protect account credentials.
          </p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>
            We retain records as needed for order operations, legal obligations, dispute
            handling, and fraud prevention.
          </p>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>
            You may request profile corrections and account-related privacy support via
            official contact channels.
          </p>
        </section>

        <section>
          <h2>8. Policy Updates</h2>
          <p>
            This policy may be updated over time. Continued use of the platform indicates
            acceptance of the latest policy version.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
