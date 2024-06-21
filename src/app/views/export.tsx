import { Component, Fragment, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import download from '../../lib/utils/download'

export default class ExportView extends Component<ViewProps> {
  private readonly handleExport = (evt: MouseEvent): void => {
    evt.preventDefault()

    const { filename } = this.props
    const file = new Blob([this.props.pathbuilder.toXML()], { type: 'application/xml' })
    download(file, filename !== '' ? filename : 'pathbuilder.xml')
      .catch(() => console.error('never reached'))
  }

  render (): ComponentChild {
    const { filename } = this.props
    return (
      <Fragment>
        <p>
          Use the button below to save the pathbuilder as an xml file.
          This usually corresponds to exactly the file that was originally loaded.
        </p>

        <button onClick={this.handleExport}>Save {typeof filename === 'string' && filename !== '' ? filename : 'pathbuilder.xml'}</button>
      </Fragment>
    )
  }
}
