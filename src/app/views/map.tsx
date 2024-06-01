import { h, Component, ComponentChildren, Fragment } from 'preact';
import type { ViewProps } from "../viewer";

export default class MapView extends Component<ViewProps> {
    render() {
        const mp = this.props.ns.toMap();
        
        const rows = new Array();
        mp.forEach((short, long) => {
            rows.push(
                <tr key={long}>
                    <td>
                        <code>{short}</code>
                    </td>
                    <td>
                        <code>{long}</code>
                    </td>
                </tr>
            )
        })
        return <Fragment>
            <h2>Namespace Map</h2>
            <p>
                This namespace map was automatically generated from the paths contained in the pathbuilder.
                It is used only for display purposes, as exports always contain the full URL.

                A future version of <code>SIfP</code> will allow manually adjusting the namespace map.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>
                            NS
                        </th>
                        <th>
                            URI
                        </th>
                    </tr>
                </thead>
                <tbody>{...rows}</tbody>
            </table>
        </Fragment>
    }
}