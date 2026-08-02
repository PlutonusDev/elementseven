import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/settings";
import { LegalPage, LegalSection } from "@/components/store/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Element Seven collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const settings = await getStoreSettings();

  return (
    <LegalPage title="Privacy Policy" updated="1 July 2026">
      <p>
        {settings.storeName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy and handles
        your personal information in accordance with the Australian Privacy Principles under the
        Privacy Act 1988 (Cth). This policy explains what we collect, why, and how we protect it.
      </p>

      <LegalSection heading="1. Information we collect">
        <ul>
          <li>
            <strong>Account details</strong>, your name, email address, and password (stored only as
            a secure one-way hash).
          </li>
          <li>
            <strong>Order and delivery details</strong>, shipping address, phone number, and order
            history.
          </li>
          <li>
            <strong>Payment information</strong>, processed by Stripe. We receive confirmation of
            payment and the last four digits of your card, but never your full card number.
          </li>
          <li>
            <strong>Communications</strong>, your marketing preferences and any messages you send
            us.
          </li>
          <li>
            <strong>Technical data</strong>, cookies required for the age gate, your session, and
            your cart.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <ul>
          <li>To verify you are 18 or over and permitted to purchase.</li>
          <li>To process, fulfil, and deliver your orders.</li>
          <li>To send transactional emails such as order and shipping confirmations.</li>
          <li>To send marketing emails, only where you have opted in.</li>
          <li>To provide support and respond to your enquiries.</li>
          <li>To detect and prevent fraud, and to meet our legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Marketing and unsubscribing">
        <p>
          We only send marketing emails if you have opted in. Every marketing email includes a
          one-click unsubscribe link, and you can change your preference at any time from your
          account&rsquo;s email preferences page. Unsubscribing from marketing does not stop essential
          transactional emails about orders you have placed.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cookies">
        <p>
          We use strictly necessary cookies to remember your age confirmation, keep you signed in, and
          hold your cart. These are required for the site to function and are not used for
          cross-site advertising.
        </p>
      </LegalSection>

      <LegalSection heading="5. Sharing your information">
        <p>
          We do not sell your personal information. We share it only with service providers who help
          us operate the store, our payment processor (Stripe), our email delivery provider, and our
          delivery carriers, and only to the extent needed to provide their service. These providers
          are bound to protect your information. We may also disclose information where required by
          law.
        </p>
      </LegalSection>

      <LegalSection heading="6. Data security and retention">
        <p>
          We take reasonable steps to protect your information from misuse, loss, and unauthorised
          access, including hashing passwords and encrypting data in transit. We keep order records
          for as long as required to meet tax, accounting, and legal obligations, then delete or
          anonymise them.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your rights">
        <p>
          You may request access to, or correction of, the personal information we hold about you, or
          ask us to delete it where we are not required to keep it. To make a request, or if you have
          a privacy concern, contact us at{" "}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>. If you are not
          satisfied with our response, you may contact the Office of the Australian Information
          Commissioner.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes to this policy">
        <p>
          We may update this policy from time to time. The current version will always be available on
          this page with its effective date.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
