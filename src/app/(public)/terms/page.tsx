import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | VYTL',
  description: 'Terms of Service for the VytlRx risk management platform. Governing South African law, ECTA compliance, subscription terms, and acceptable use.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Acceptance of Terms</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you
              (the individual or entity accessing or using the VytlRx Platform) and VytlRx (Pty) Ltd, a private
              company registered under the laws of the Republic of South Africa (&ldquo;VYTL&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By registering for an account, accessing, or using the
              VytlRx Platform, you agree to be bound by these Terms.
            </p>
            <p>
              If you are accepting these Terms on behalf of a company, organisation, or other legal entity,
              you represent and warrant that you have authority to bind that entity to these Terms. In that
              case, &ldquo;you&rdquo; and &ldquo;your&rdquo; refer to that entity. If you do not agree to
              these Terms, you may not access or use the Platform. These Terms are drafted and interpreted
              in accordance with the Electronic Communications and Transactions Act 25 of 2002 (ECTA) and
              constitute a valid and enforceable electronic agreement.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Service Description</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              VytlRx provides a cloud-based enterprise risk management Software-as-a-Service (&ldquo;SaaS&rdquo;)
              platform designed to assist South African organisations in identifying, assessing, documenting,
              and managing risks. The Platform includes features such as risk registers, risk scoring and
              heatmaps, KRI monitoring, treatment plan management, incident tracking, regulatory mapping,
              AI-powered risk analysis, board reporting, and compliance tools aligned with frameworks
              including the King IV Report on Corporate Governance, ISO 31000:2018, and POPIA.
            </p>
            <p>
              VytlRx reserves the right to modify, suspend, or discontinue any feature or functionality of
              the Platform at any time, with or without notice. We will use reasonable efforts to provide
              advance notice of material changes. New features, tools, or resources made available through
              the Platform are subject to these Terms unless VytlRx expressly indicates otherwise.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Account Registration</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              To access the Platform, you must create an account by providing accurate, complete, and
              current information including your name, organisation name, and a valid email address. You
              are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account. You must notify VytlRx immediately at support@vytlrx.app
              of any unauthorised use of your account or any other security breach.
            </p>
            <p>
              Each account is associated with a single organisation (&ldquo;Organisation&rdquo;). The person
              who creates the Organisation account is designated as the Owner and has full administrative
              control. Additional users may be invited to join the Organisation and assigned roles (ADMIN,
              RISK_MANAGER, EDITOR, or VIEWER) with corresponding access privileges. You are responsible
              for managing your Organisation&rsquo;s users and ensuring that each user complies with these Terms.
            </p>
            <p>
              You must be at least 18 years of age and have legal capacity to enter into binding agreements
              under South African law to create an account. Accounts may not be created for the purpose
              of competitive intelligence gathering, benchmarking against VYTL, or any other purpose that
              conflicts with these Terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Acceptable Use</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              You agree to use the Platform only for lawful purposes and in accordance with these Terms.
              You may not: (a) use the Platform in any manner that violates applicable South African law
              or regulation; (b) transmit any material that is false, defamatory, harassing, abusive,
              threatening, or obscene; (c) upload or transmit any viruses, malware, or other malicious
              code; (d) attempt to gain unauthorised access to any part of the Platform or its related
              systems; (e) use automated means (bots, scrapers, crawlers) to access the Platform without
              our express written consent; (f) reverse engineer, decompile, or disassemble any part of
              the Platform; or (g) use the Platform to process personal information in violation of POPIA
              or any applicable data protection law.
            </p>
            <p>
              VytlRx reserves the right to investigate and take appropriate action if you violate these
              acceptable use requirements, including suspending or terminating your account, reporting
              conduct to law enforcement authorities, and seeking legal remedies.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Subscription and Payment</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              Access to certain features of the Platform requires a paid subscription. Subscription
              fees are set out in the pricing page on our website and may be updated from time to time
              with thirty (30) days&rsquo; notice. All fees are quoted in South African Rand (ZAR) and are
              exclusive of Value Added Tax (VAT) at the applicable rate. By subscribing, you authorise
              VytlRx to charge your selected payment method for the applicable subscription fees on a
              recurring basis in accordance with your chosen billing cycle (monthly or annual).
            </p>
            <p>
              Subscriptions are non-refundable except as required by applicable South African consumer
              protection law, including the Consumer Protection Act 68 of 2008 where applicable. If you
              cancel your subscription, you will retain access to the Platform until the end of your current
              billing period, after which your account will be downgraded or closed. Annual subscriptions
              may be cancelled at the end of the annual term. VytlRx may suspend access to your account for
              non-payment of fees after a grace period of seven (7) days following the due date.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Intellectual Property Ownership</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              As between you and VYTL, VytlRx retains all right, title, and interest in and to the Platform,
              including all software, algorithms, databases, designs, trade marks, and other intellectual
              property. As between you and VYTL, you retain all right, title, and interest in and to the
              data and content that you upload or create within the Platform (&ldquo;Your Data&rdquo;).
            </p>
            <p>
              You grant VytlRx a limited, non-exclusive, royalty-free licence to access, use, copy, and
              process Your Data solely to provide and improve the Platform and related services, and as
              otherwise described in our Privacy Notice. VytlRx will not share Your Data with third parties
              except as set out in our Privacy Notice or as required by law. VytlRx may use aggregated,
              de-identified data derived from all customers to improve the Platform, provided that such
              data cannot be used to identify you or your organisation.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Confidentiality</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              Each party acknowledges that it may receive confidential information of the other party in
              connection with these Terms. &ldquo;Confidential Information&rdquo; means non-public information
              that is designated as confidential or that reasonably should be understood to be confidential
              given the nature of the information and the circumstances of disclosure. Each party agrees
              to: (a) keep the other party&rsquo;s Confidential Information confidential using at least the
              same degree of care it uses for its own confidential information (but not less than reasonable
              care); (b) not disclose the other party&rsquo;s Confidential Information to third parties without
              prior written consent; and (c) use the other party&rsquo;s Confidential Information only for
              purposes of the relationship contemplated by these Terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Data and Privacy</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              Your use of the Platform involves the collection and processing of personal information as
              described in our Privacy Notice, which is incorporated into these Terms by reference. Where
              you use the Platform to process the personal information of your employees, contractors,
              customers, or other individuals, you act as the responsible party under POPIA and VytlRx acts
              as an operator processing personal information on your instructions. You warrant that you
              have obtained all necessary consents and have a lawful basis for directing VytlRx to process
              such personal information.
            </p>
            <p>
              You are responsible for ensuring that your use of the Platform complies with POPIA and all
              other applicable data protection laws. VytlRx will process personal information only in
              accordance with your documented instructions, except where required to do otherwise by law.
              Our data processing obligations are further set out in our Data Processing Agreement, which
              is available on request and forms part of these Terms for enterprise customers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Service Availability</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              VytlRx targets a monthly uptime of 99.5% for the Platform (excluding scheduled maintenance
              windows and circumstances beyond our reasonable control). Scheduled maintenance will be
              communicated at least 24 hours in advance where possible. We will publish our current
              service status at status.vytlrx.app.
            </p>
            <p>
              VytlRx does not warrant that the Platform will be uninterrupted or error-free. In the event
              of a material service disruption lasting more than four (4) continuous hours, you may be
              eligible for a service credit, as set out in our Service Level Agreement (available to
              paid subscribers on request). Service credits are your sole and exclusive remedy for
              service unavailability and are subject to the limitation of liability provisions in
              clause 10 below.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">10. Limitation of Liability</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              To the maximum extent permitted by South African law, VytlRx shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of profits,
              loss of data, loss of goodwill, or business interruption, arising out of or in connection
              with these Terms or your use of or inability to use the Platform, even if VytlRx has been
              advised of the possibility of such damages.
            </p>
            <p>
              In no event shall VYTL&rsquo;s aggregate liability for all claims under these Terms exceed
              the total fees paid by you in the twelve (12) months immediately preceding the event giving
              rise to the claim, or ZAR 50,000, whichever is greater. Nothing in these Terms excludes or
              limits VYTL&rsquo;s liability for death or personal injury caused by negligence, fraud, or
              fraudulent misrepresentation, or any other liability that cannot be excluded under applicable
              law.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">11. Indemnification</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              You agree to indemnify, defend, and hold harmless VYTL, its directors, employees, contractors,
              agents, and licensors from and against any claims, damages, losses, liabilities, costs, and
              expenses (including reasonable attorneys&rsquo; fees) arising out of or relating to: (a) your
              breach of these Terms; (b) your use or misuse of the Platform; (c) Your Data or content you
              submit to the Platform; (d) your violation of any applicable law or regulation; or (e) your
              infringement of any third-party intellectual property or other rights.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">12. Termination</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              You may terminate your account at any time by cancelling your subscription through the
              Platform settings or by contacting us at support@vytlrx.app. VytlRx may suspend or terminate
              your access to the Platform with immediate effect if: (a) you breach these Terms and fail
              to remedy the breach within fourteen (14) days of written notice; (b) you become insolvent
              or enter into business rescue, liquidation, or sequestration; (c) you use the Platform in
              a manner that poses a security risk or legal liability to VytlRx or other users; or (d) we
              are required to do so by law.
            </p>
            <p>
              Upon termination, your right to access the Platform ceases immediately. VytlRx will retain
              Your Data for thirty (30) days after termination, during which time you may request an
              export of your data. After this period, Your Data will be deleted in accordance with our
              data retention policy. Clauses relating to intellectual property, confidentiality, limitation
              of liability, indemnification, and governing law survive termination.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">13. Changes to Terms</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              VytlRx reserves the right to modify these Terms at any time. We will provide at least thirty
              (30) days&rsquo; advance notice of material changes by email or by posting a notice on the Platform.
              Your continued use of the Platform after the effective date of the changes constitutes your
              acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop
              using the Platform and cancel your subscription before the changes take effect.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">14. Governing Law</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              These Terms and any dispute arising out of or in connection with them shall be governed by
              and construed in accordance with the laws of the Republic of South Africa. The Electronic
              Communications and Transactions Act 25 of 2002 (ECTA) applies to all electronic transactions
              and communications under these Terms. The parties consent to the exclusive jurisdiction of
              the High Court of South Africa, Western Cape Division (Cape Town) for the resolution of all
              disputes arising out of or relating to these Terms.
            </p>
            <p>
              Before commencing formal legal proceedings, the parties agree to attempt to resolve any
              dispute by good-faith negotiation for a period of thirty (30) days. If the dispute cannot
              be resolved by negotiation, either party may refer it to mediation through the Arbitration
              Foundation of Southern Africa (AFSA) before commencing litigation, unless emergency or
              injunctive relief is required.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
