import { type VNode } from 'preact' // prettier-ignore
import generateDisclaimer from '../../macros/disclaimer' with { type: 'macro' }

const disclaimer = generateDisclaimer()

export default function Legal(): VNode<any> {
  return (
    <>
      <p>
        While the code to this project is open source and you may inspect it to
        your heart's content, it (currently) does not have a license. This means
        that you may not run, create derivative works of or distribute this code
        (except for what is explicitly permitted by{' '}
        <a
          href='https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#5-license-grant-to-other-users'
          target='_blank'
          rel='noopener noreferrer'
        >
          Section 5 of GitHub terms of service
        </a>
        ). In particular you are not granted a license to use this code to
        create visualizations of your own pathbuilders. If you would like to
        acquire a license to use this software, please contact us.
      </p>
      <p>
        This app makes use of several JavaScript libraries. Some of these
        require that attribution is given to their authors. You can look at
        these notices below.
      </p>
      <details>
        <summary>Legal Notices</summary>
        <LegalDisclaimer />
      </details>
    </>
  )
}

export function LegalDisclaimer(): VNode<any> {
  return (
    <pre>
      <code>{disclaimer}</code>
    </pre>
  )
}
