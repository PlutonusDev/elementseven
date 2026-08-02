import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/settings";
import { LegalPage, LegalSection } from "@/components/store/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of the Element Seven store.",
};

export default async function TermsPage() {
  const settings = await getStoreSettings();

  return (
    <LegalPage title="Terms of Service" updated="1 July 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the{" "}
        {settings.storeName} website and your purchase of any products from us. By using this site or
        placing an order, you agree to these Terms. If you do not agree, please do not use the site.
      </p>

      <LegalSection heading="1. Age restriction">
        <p>
          Our products contain nicotine and are strictly for adults aged 18 years or over. By
          accessing the store, creating an account, or placing an order, you confirm that you are at
          least 18 years old. We operate an age-verification gate on entry and reserve the right to
          request proof of age at any time. We will cancel and refund any order where we reasonably
          believe the purchaser is under 18.
        </p>
      </LegalSection>

      <LegalSection heading="2. Products and health warning">
        <p>
          This product contains nicotine. Nicotine is an addictive chemical. Our products are not a
          smoking-cessation aid and are not intended to diagnose, treat, cure, or prevent any
          disease. They are not suitable for use by pregnant or breastfeeding women, people with
          heart conditions, or anyone sensitive to nicotine. Keep all products and liquids out of
          reach of children and pets. If you experience adverse effects, discontinue use and seek
          medical advice.
        </p>
      </LegalSection>

      <LegalSection heading="3. Orders and pricing">
        <p>
          All prices are listed in Australian dollars (AUD) and include GST where applicable.
          Displaying a product on the site is an invitation to treat, not an offer. Your order is an
          offer to buy, which we accept when we confirm payment. We reserve the right to refuse or
          cancel any order, including where a product is mispriced, out of stock, or where we suspect
          fraud or a breach of these Terms.
        </p>
        <p>
          Stock is limited and shown in real time. Where an item sells out between you starting
          checkout and payment completing, we will refund the affected items in full.
        </p>
      </LegalSection>

      <LegalSection heading="4. Payment">
        <p>
          Payments are processed securely by Stripe. We do not store your full card details. By
          submitting payment, you warrant that you are authorised to use the payment method provided.
        </p>
      </LegalSection>

      <LegalSection heading="5. Shipping and delivery">
        <p>
          Shipping costs and estimated delivery windows are calculated at checkout based on your
          postcode and order weight. Delivery estimates are indicative and not guaranteed. Risk in
          the goods passes to you on delivery to the address you provide. You are responsible for
          providing an accurate, complete delivery address.
        </p>
      </LegalSection>

      <LegalSection heading="6. Returns and refunds">
        <p>
          For hygiene and safety reasons, we cannot accept returns of opened e-liquids, disposables,
          pods, or coils unless the item is faulty. If a product arrives damaged, faulty, or not as
          described, contact us within 14 days of delivery for a replacement or refund in line with
          your rights under the Australian Consumer Law. Nothing in these Terms limits those
          statutory rights.
        </p>
      </LegalSection>

      <LegalSection heading="7. Accounts">
        <p>
          You are responsible for keeping your account credentials secure and for all activity under
          your account. Notify us immediately of any unauthorised use. We may suspend or terminate
          accounts that breach these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="8. Acceptable use">
        <p>
          You agree not to misuse the site, attempt to gain unauthorised access, interfere with its
          operation, or resell products purchased from us without our written consent.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, and subject to your non-excludable rights under the
          Australian Consumer Law, our total liability arising from any order is limited to the amount
          you paid for that order. We are not liable for indirect or consequential loss.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to these Terms">
        <p>
          We may update these Terms from time to time. The version in effect at the time you place an
          order governs that purchase. Continued use of the site after changes are posted constitutes
          acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions about these Terms? Email us at{" "}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
