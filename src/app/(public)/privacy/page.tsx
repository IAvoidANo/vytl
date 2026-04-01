import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Notice | VYTL',
  description: 'POPIA-compliant privacy notice for the VytlRx risk management platform. Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Notice</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Introduction</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              VytlRx (Pty) Ltd (&ldquo;VYTL&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              respects your privacy and is committed to protecting your personal information. This Privacy
              Notice describes how we collect, use, share, and safeguard your personal information in
              connection with the VytlRx risk management platform (&ldquo;Platform&rdquo;) and our related
              services, website, and communications.
            </p>
            <p>
              This notice is issued in compliance with the Protection of Personal Information Act 4 of 2013
              (POPIA) and its regulations. It applies to all personal information processed by VytlRx in
              its capacity as a responsible party, as well as personal information processed on behalf of
              our customers (where VytlRx acts as an operator). If you are a customer of VYTL, a separate
              Data Processing Agreement governs our processing of personal information on your behalf.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Information Officer</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              In terms of section 55 of POPIA, VytlRx has appointed an Information Officer who is responsible
              for ensuring compliance with POPIA and for handling requests from data subjects. Our Information
              Officer can be contacted as follows:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>Name:</strong> Information Officer, VytlRx (Pty) Ltd</li>
              <li><strong>Email:</strong> privacy@vytlrx.app</li>
              <li><strong>Postal Address:</strong> VytlRx (Pty) Ltd, Western Cape, South Africa</li>
            </ul>
            <p>
              Complaints regarding our processing of personal information may also be submitted to the
              Information Regulator of South Africa at inforeg.org.za or by email to inforeg@justice.gov.za.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Personal Information We Collect</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We collect personal information that you provide directly to us, information generated through
              your use of the Platform, and information from third parties where applicable. The categories
              of personal information we process include:
            </p>
            <p>
              <strong>Account and identity information:</strong> your name, email address, job title,
              organisation name, and password (stored as a one-way cryptographic hash). This information
              is necessary to create and maintain your account and to verify your identity when you access
              the Platform.
            </p>
            <p>
              <strong>Usage and activity data:</strong> records of actions you take within the Platform,
              including risks you create or modify, audit log entries, login timestamps, IP addresses,
              browser type and version, and device identifiers. This information is retained for security,
              audit trail, and compliance purposes.
            </p>
            <p>
              <strong>Risk and business data:</strong> risk descriptions, assessments, treatment plans,
              KRI values, incident reports, and other content you upload or create within the Platform.
              This is your data; VytlRx processes it as an operator on your instructions.
            </p>
            <p>
              <strong>Communication data:</strong> the content of support requests, feedback, and other
              communications you send to us, including email correspondence.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">How We Use Your Personal Information</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We use your personal information for the following purposes: to provide, maintain, and improve
              the Platform and our services; to create and manage your account; to process payments and
              manage your subscription; to send you transactional emails such as account confirmations,
              password resets, and invite notifications; to respond to your enquiries and provide customer
              support; to detect, investigate, and prevent fraudulent or unauthorised activity; to comply
              with our legal obligations; and to send you product updates and service announcements (you
              may opt out at any time).
            </p>
            <p>
              We use AI technology (Anthropic Claude API) to power features including risk analysis
              suggestions and document extraction. When you invoke these features, relevant text content
              from your risk register may be transmitted to Anthropic&rsquo;s API for processing. Anthropic
              does not use API input or output to train its models by default. Please refer to Anthropic&rsquo;s
              privacy policy for further details.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Lawful Basis for Processing</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              Under POPIA, we process your personal information on the following grounds: contract
              performance (processing necessary to provide the services you have contracted for);
              legitimate interests (security monitoring, fraud prevention, Platform improvement, and
              analytics, where our interests are not overridden by your rights); legal obligation
              (processing required by applicable South African law); and consent (where we have
              obtained your specific, informed consent, such as for optional marketing communications).
            </p>
            <p>
              Where we rely on consent as our lawful basis, you have the right to withdraw your consent
              at any time without affecting the lawfulness of processing carried out before withdrawal.
              To withdraw consent, please contact us at privacy@vytlrx.app or use the unsubscribe link
              in any marketing email.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Sharing with Third Parties</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We do not sell, rent, or trade your personal information to third parties for their own
              marketing purposes. We share personal information only in the following circumstances:
              with service providers acting as operators on our behalf (subject to appropriate data
              processing agreements); where required by law, court order, or lawful authority; or in
              connection with a merger, acquisition, or sale of assets (in which case we will notify
              affected users).
            </p>
            <p>
              Our principal subprocessors are: <strong>Vercel Inc.</strong> (Platform hosting,
              serverless compute, and edge delivery — servers in the United States with EU/regional
              options); <strong>Neon Inc.</strong> (managed PostgreSQL database hosting — data region
              configurable per account); <strong>Resend Inc.</strong> (transactional email delivery);
              and <strong>Anthropic PBC</strong> (AI analysis features, used only when you invoke
              AI-powered functionality). Each subprocessor is bound by contractual terms that require
              them to process personal information only for the purposes we specify and to implement
              appropriate security measures.
            </p>
            <p>
              Where personal information is transferred outside the Republic of South Africa, we ensure
              that adequate safeguards are in place in accordance with section 72 of POPIA, including
              binding contractual clauses that provide a level of protection substantially similar to
              POPIA.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Data Retention</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We retain your personal information for as long as necessary to provide the Platform,
              fulfil the purposes described in this notice, and comply with our legal obligations.
              Specifically: account data is retained for the duration of your subscription and for
              three (3) years after account closure to comply with financial record-keeping requirements;
              audit logs are retained for five (5) years to support governance and compliance
              requirements; and backup copies may be retained for up to ninety (90) days after deletion.
            </p>
            <p>
              Your organisation can configure custom data retention periods within the Platform under
              Settings &rsaquo; POPIA Compliance, in accordance with your own retention obligations. When a
              configured retention period expires, data is automatically flagged for review and deletion.
              Upon account closure or subscription cancellation, we will delete or anonymise your data
              within thirty (30) days unless a longer retention period is required by law.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Rights Under POPIA</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              As a data subject under POPIA, you have the following rights: the right to be notified
              when your personal information is collected; the right to access the personal information
              we hold about you; the right to request correction of inaccurate, incomplete, or outdated
              information; the right to request deletion or destruction of your personal information
              where it is no longer necessary for the purpose for which it was collected; the right to
              object to the processing of your personal information on grounds relating to your specific
              situation; the right to request restriction of processing; and the right to data portability
              (to receive your personal information in a structured, commonly used format).
            </p>
            <p>
              To exercise any of these rights, please submit a written request to privacy@vytlrx.app. We
              will acknowledge your request within five (5) business days and respond fully within thirty
              (30) days. If your request is complex or numerous, we may extend this period by a further
              thirty (30) days with prior notice. We may need to verify your identity before processing
              your request. We do not charge a fee for exercising your rights unless requests are
              manifestly unfounded or excessive.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Cookies and Tracking Technologies</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              The VytlRx Platform uses strictly necessary cookies and session tokens to authenticate your
              session and maintain your login state. These are essential for the Platform to function and
              cannot be disabled. We use JSON Web Tokens (JWT) stored in secure, HttpOnly cookies for
              authentication.
            </p>
            <p>
              We do not use third-party advertising cookies, cross-site tracking pixels, or behavioural
              advertising technologies. If we introduce optional analytics cookies or marketing cookies
              in the future, we will obtain your consent via a cookie consent mechanism and update this
              notice accordingly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Security Measures</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We implement appropriate technical and organisational measures to protect your personal
              information against unauthorised access, disclosure, alteration, and destruction. These
              measures include: TLS 1.2+ encryption in transit; AES-256 encryption at rest for database
              storage; bcrypt password hashing; multi-tenancy data isolation enforced at the database query
              level; role-based access controls (RBAC) with five privilege levels; rate limiting on sensitive
              operations; and comprehensive audit logging.
            </p>
            <p>
              Despite these measures, no method of transmission or storage is completely secure. We cannot
              guarantee absolute security. In the event of a data breach that is likely to result in a risk
              to your rights and freedoms, we will notify the Information Regulator within seventy-two (72)
              hours of becoming aware of the breach, and will notify affected data subjects without undue
              delay.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Updates to This Notice</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We may update this Privacy Notice from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. We will notify you of material changes
              by email (to the address associated with your account) or by posting a prominent notice
              on the Platform at least fourteen (14) days before the changes take effect. The date at
              the top of this notice indicates the last revision date.
            </p>
            <p>
              For any questions or concerns about this Privacy Notice or our data practices, please
              contact our Information Officer at privacy@vytlrx.app.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
