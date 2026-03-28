import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility Statement | VytlRx',
  description: 'VytlRx accessibility statement — our commitment to WCAG 2.1 AA conformance, known limitations, and how to provide feedback.',
}

export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Accessibility Statement</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Our Commitment</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              VytlRx (Pty) Ltd is committed to making the VytlRx risk management platform accessible to all
              users, including people with disabilities. We believe that inclusive design benefits everyone,
              and we strive to ensure that our Platform can be used effectively by the broadest possible
              audience, regardless of ability or the technology used to access it.
            </p>
            <p>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, as
              published by the World Wide Web Consortium (W3C). WCAG 2.1 AA defines how to make web
              content more accessible to people with disabilities, covering four principles: perceivable,
              operable, understandable, and robust (POUR). Achieving WCAG 2.1 AA conformance is an ongoing
              goal and we continuously review and improve the Platform to this standard.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Conformance Status</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              The VytlRx Platform is <strong>partially conformant</strong> with WCAG 2.1 Level AA. Partially
              conformant means that some parts of the Platform do not yet fully conform to the accessibility
              standard. We are actively working to address known gaps and improve our conformance status.
              This statement reflects the current status of the Platform as of the date indicated above.
            </p>
            <p>
              Our internal accessibility reviews are conducted on a quarterly basis, and we carry out
              testing using a combination of automated tools (Axe, Lighthouse), keyboard-only navigation
              testing, and screen reader testing with NVDA on Windows and VoiceOver on macOS. We welcome
              user feedback to help us identify additional issues.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Technical Specifications</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              The VytlRx Platform relies on the following technologies for conformance with WCAG 2.1:
              HTML5, CSS3, JavaScript, and WAI-ARIA (Accessible Rich Internet Applications). The Platform
              uses semantic HTML elements throughout, including landmark regions (&lt;header&gt;,
              &lt;main&gt;, &lt;nav&gt;, &lt;footer&gt;), headings in logical hierarchy (h1-h6), and form
              elements with explicit labels. Interactive components such as modals, dropdowns, and tooltips
              use appropriate ARIA roles, states, and properties.
            </p>
            <p>
              <strong>Keyboard navigation:</strong> All interactive elements in the Platform are accessible
              via keyboard using Tab, Shift+Tab, Enter, Space, and arrow keys as appropriate. Focus is
              managed when modals open and close, and focus indicators are visible on all focusable elements.
              The Platform includes a skip-to-main-content link at the top of each page to allow keyboard
              users to bypass navigation.
            </p>
            <p>
              <strong>Colour contrast:</strong> We target a minimum contrast ratio of 4.5:1 for normal
              text and 3:1 for large text (18pt or 14pt bold), in conformance with WCAG 2.1 Success
              Criterion 1.4.3. Status indicators and data visualisations (such as the risk heatmap and
              score badges) are not colour-only and include text labels or patterns to convey meaning
              to users who cannot perceive colour differences.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Known Limitations</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              Despite our best efforts, some areas of the Platform do not yet fully meet WCAG 2.1 AA
              standards. Known limitations include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Drag-and-drop interfaces</strong> (Kanban board, dashboard widget reordering):
                These features currently rely on mouse or touch interaction. Keyboard alternatives for
                reordering are planned for a future release.
              </li>
              <li>
                <strong>Complex data tables</strong> (risk register, KRI monitoring): Column sorting
                state changes may not be consistently announced by all screen readers. Improvements
                to ARIA live regions are planned.
              </li>
              <li>
                <strong>PDF report export</strong> (Board Report): Generated PDF documents may not be
                fully tagged for accessibility. We plan to implement tagged PDF output in a future sprint.
              </li>
              <li>
                <strong>Chart and heatmap visualisations</strong>: Some chart components provide text
                alternatives but may not expose full data sets in a table format. We are working on
                adding data table alternatives for all visualisations.
              </li>
            </ul>
            <p>
              We are committed to resolving these limitations and will update this statement as progress
              is made. If you encounter an issue not listed here, please contact us using the details below.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Supported Browsers and Assistive Technologies</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              The VytlRx Platform is designed to work with modern web browsers including Google Chrome
              (version 110+), Mozilla Firefox (version 110+), Microsoft Edge (version 110+), and Apple
              Safari (version 16+) on desktop and mobile devices. We test with the following assistive
              technology combinations: NVDA 2024 with Chrome on Windows 11; VoiceOver with Safari on
              macOS Sonoma; VoiceOver with Safari on iOS 17; and TalkBack with Chrome on Android 14.
            </p>
            <p>
              The Platform is responsive and designed to be usable on screen widths from 375px (mobile)
              upward. Text can be resized up to 200% without loss of content or functionality. The Platform
              does not require the use of a mouse; all functionality is available via keyboard or touch.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Feedback and Contact</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              We welcome feedback on the accessibility of the VytlRx Platform. If you experience any barrier
              that prevents you from accessing content or functionality, or if you require information in
              an alternative format, please contact us at:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>Email:</strong> accessibility@vytlrx.app</li>
              <li><strong>Response time:</strong> We aim to respond within five (5) business days</li>
            </ul>
            <p>
              When contacting us, please describe the barrier or issue you have encountered, the assistive
              technology and browser you are using, and the URL of the page where the issue occurred. This
              information helps us to replicate and resolve the issue as quickly as possible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Formal Complaints</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3">
            <p>
              If you are not satisfied with our response to your accessibility concern, or if you believe
              we have failed to meet our obligations, you may lodge a formal complaint with the South
              African Human Rights Commission (SAHRC), which has a mandate to promote and protect human
              rights including rights relating to equality and non-discrimination. The SAHRC can be
              contacted at:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>Website:</strong> sahrc.org.za</li>
              <li><strong>Toll-free:</strong> 0800 212 116</li>
              <li><strong>Email:</strong> info@sahrc.org.za</li>
            </ul>
            <p>
              South African law, including the Promotion of Equality and Prevention of Unfair Discrimination
              Act 4 of 2000 (PEPUDA/Equality Act), prohibits unfair discrimination on grounds of disability.
              VytlRx is committed to reasonable accommodation and to continuously improving the accessibility
              of our Platform for all users.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
