import React from 'react';
import './LegalPages.css';

const TermsAndConditions = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero legal-terms">
        <h1>Terms and Conditions</h1>
        <p>Effective Date: April 13, 2026</p>
      </section>

      <main className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using Mejia Spareparts services and website, you agree to these terms.
            If you do not agree, please do not use the platform.
          </p>
        </section>

        <section>
          <h2>2. Orders and Availability</h2>
          <p>
            All orders are subject to stock availability and admin verification. We may
            adjust or cancel orders when items become unavailable or if there are pricing
            or listing errors.
          </p>
        </section>

        <section>
          <h2>3. Payment Terms</h2>
          <p>
            Supported payment methods include those shown during checkout. Additional
            verification may apply to GCash transactions.
          </p>
          <p>
            For GCash payments, downpayment is non-refundable once payment is verified.
          </p>
        </section>

        <section>
          <h2>4. Delivery and Fulfillment</h2>
          <p>
            Delivery timelines are estimates and may vary by location, weather, and
            logistics conditions. Pickup orders must be claimed within the advised
            timeframe.
          </p>
        </section>

        <section>
          <h2>5. Returns and Cancellations</h2>
          <p>
            Cancellation approval depends on order status. Some payments and fees may be
            non-refundable under policy.
          </p>
        </section>

        <section>
          <h2>6. Product Information</h2>
          <p>
            We aim to keep listings accurate, but minor variations in color, packaging,
            and appearance may occur. Compatibility checks remain the buyer's
            responsibility unless explicitly confirmed.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            Mejia Spareparts is not liable for indirect or incidental losses arising from
            platform use, delayed shipments, or misuse of products.
          </p>
        </section>

        <section>
          <h2>8. Updates to Terms</h2>
          <p>
            We may update these terms when needed. Continued use of the platform means
            you accept the latest version.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsAndConditions;
