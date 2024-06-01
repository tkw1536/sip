import { DOMParser } from 'xmldom';
export class Pathbuilder {
    constructor(
        public paths: Path[],
    ) { }

    static parse(source: string): Pathbuilder {
        const parser = new DOMParser();
        const result = parser.parseFromString(source, 'text/xml');

        // find the top level node
        const pbiface = Array.from(result.childNodes).filter(x => x.nodeType == result.ELEMENT_NODE)
        if (pbiface.length != 1) {
            new Error('expected exactly one child element in top-level xml')
        }
        return this.fromNode(pbiface[0]);
    }
    static fromNode(node: Node): Pathbuilder {
        if (node.nodeName !== 'pathbuilderinterface') {
            throw new Error(`expected a <pathbuilderinterface>, but got a <${node.nodeName}>`)
        }

        // parse all the paths
        const paths = Array.from(node.childNodes).filter(node => node.nodeType == node.ELEMENT_NODE)
        return new Pathbuilder(paths.map(n => Path.fromNode(n as Element)));
    }
}

export class Path {
    constructor(
        public id: string,
        public weight: number,
        public enabled: boolean, /* bool as int */
        public group_id: string, /* string with zero */
        public bundle: string,
        public field: string,
        public fieldtype: string,
        public displaywidget: string,
        public formatterwidget: string,
        public cardinality: number, /* number */
        public field_type_informative: string,
        public path_array: string[], /* todo */
        public datatype_property: string,
        public short_name: string,
        public disam: string,
        public description: string,
        public uuid: string,
        public is_group: boolean, /* boolean as int */
        public name: string,
    ) {

    }

    private static parseValue<T>(element: Element, name: string, parser: (value: string) => T): T {
        const children = Array.from(element.childNodes).filter(node => node.nodeName === name);
        if (children.length > 1) {
            throw new Error(`expected exactly one <${name}> child, but got ${children.length}`);
        }
        
        // if there are no children, pretend it is empty
        if (children.length == 0) {
            return parser("");
        }

        return parser(
            Array.from(children[0].childNodes).map(e => e.nodeType === e.TEXT_NODE ? e.textContent : "").join("")
        );
    }
    private static parsePathArray(element: Element): Array<string> {
        const children = Array.from(element.childNodes).filter(node => node.nodeName === "path_array");
        if (children.length === 0) {
            throw new Error("expected exactly one <path_array> child");
        }
        return Array.from(children[0].childNodes)
            .filter(node => node.nodeType === node.ELEMENT_NODE)
            .map((p, i) => {
                const want = (i % 2 == 0) ? 'x' : 'y'
                const got = p.nodeName[0].toLowerCase()
                if (got != want) {
                    throw new Error(`expected a <${want}>, but got a <${got}>`)
                }
                return p.textContent
            });
    }
    static fromNode(node: Element): Path {
        if (node.nodeName !== "path") {
            throw new Error(`expected a <path>, but got a <${node.nodeName}>`);
        }

        const p = this.parseValue.bind(this, node);
        const str = (value: string) => value;
        const str0 = (value: string) => {
            if (value == "0") return value
            return value;
        }
        const int = (value: string): number => {
            if (value.trim() == "") {
                return 0;
            }

            const i = parseInt(value, 10)
            if (isNaN(i)) {
                throw new Error(`expected an integer, but got ${value}`);
            }
            return i;
        }
        const bool = (value: string): boolean => {
            const b = int(value)
            return b != 0
        }

        return new Path(
            p("id", str),
            p("weight", int),
            p("enabled", bool),
            p("group_id", str0),
            
            p("bundle", str),
            p("field", str),
            p("fieldtype", str),
            p("displaywidget", str),
            p("formatterwidget", str),
            p("cardinality", int),
            p("field_type_informative", str),
            
            this.parsePathArray(node), /* todo: path array */
            p("datatype_property", str),
            p("short_name", str),
            p("disam", str),
            p("description", str),
            p("uuid", str),
            p("is_group", bool),
            p("name", str),
        )
    }
}