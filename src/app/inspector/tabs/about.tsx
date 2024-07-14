import { Component, type ComponentChildren } from 'preact'

const disclaimer = import.meta.compileTime<string>('../../../../macros/disclaimer.ts') // prettier-ignore

export default class AboutTab extends Component {
  render(): ComponentChildren {
    return (
      <>
        <h2>About SIP</h2>

        <p>
          SIP is a tool provides an interface for inspecting{' '}
          <code>Pathbuilders</code> created by the{' '}
          <a
            href='https://wiss-ki.eu'
            target='_blank'
            rel='noopener noreferrer'
          >
            WissKI
          </a>{' '}
          software. It was built in 2024 by <em>Tom Wiesing</em> with the
          primary purpose to provide a better interface than plain WissKI.
        </p>

        <h3>License</h3>
        <p>
          While the code to this project is open source and you may inspect it
          to your heart's content, it (currently) does not have a license. This
          means that you may not run, create derivative works of or distribute
          this code (except for what is explicitly permitted by{' '}
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
          <pre>
            <code>{disclaimer}</code>
          </pre>
        </details>
      </>
    )
  }
}

// spellchecker:words bluenote
