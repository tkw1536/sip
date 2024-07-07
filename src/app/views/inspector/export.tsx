import { Component, type ComponentChild } from 'preact'
import download from '../../../lib/utils/download'
import { type ReducerProps } from '../../state'

export default class ExportView extends Component<ReducerProps> {
  private readonly handleExport = (evt: MouseEvent): void => {
    evt.preventDefault()

    const { filename, pathbuilder } = this.props.state
    const file = new Blob([pathbuilder.toXML()], { type: 'application/xml' })
    download(file, filename !== '' ? filename : 'pathbuilder.xml')
  }

  render(): ComponentChild {
    const { filename } = this.props.state
    return (
      <>
        <p>
          Use the button below to save the pathbuilder as an xml file. This
          usually corresponds to exactly the file that was originally loaded.
        </p>

        <button onClick={this.handleExport}>
          Save
          {typeof filename === 'string' && filename !== ''
            ? filename
            : 'pathbuilder.xml'}
        </button>
      </>
    )
  }
}
