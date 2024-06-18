import { DOMParser, DOMImplementation, XMLSerializer } from 'xmldom'
export class Pathbuilder {
  constructor (
    public paths: Path[]
  ) { }

  static parse (source: string): Pathbuilder {
    const parser = new DOMParser()
    const result = parser.parseFromString(source, 'text/xml')

    // find the top level node
    const pbInterface = Array.from(result.childNodes).filter(x => x.nodeType === result.ELEMENT_NODE)
    if (pbInterface.length !== 1) {
      throw new Error('expected exactly one child element in top-level xml')
    }
    return this.fromNode(pbInterface[0])
  }

  static fromNode (node: Node): Pathbuilder {
    if (node.nodeName !== 'pathbuilderinterface') {
      throw new Error(`expected a <pathbuilderinterface>, but got a <${node.nodeName}>`)
    }

    // parse all the paths
    const paths = Array.from(node.childNodes).filter(node => node.nodeType === node.ELEMENT_NODE)
    return new Pathbuilder(paths.map(n => Path.fromNode(n as Element)))
  }

  toXML (): string {
    const xml = new DOMImplementation().createDocument(null, 'pathbuilder.xml')

    // create the interface
    const pb = xml.createElement('pathbuilderinterface')
    this.paths.map(p => p.toXML(xml)).forEach(path => pb.appendChild(path))

    xml.appendChild(pb)
    return new XMLSerializer().serializeToString(pb)
  }
}

export class Path {
  constructor (
    public id: string,
    public weight: number,
    public enabled: boolean,
    public groupId: string, 
    public bundle: string,
    public field: string,
    public fieldType: string,
    public displayWidget: string,
    public formatterWidget: string,
    public cardinality: number, 
    public fieldTypeInformative: string,
    public pathArray: string[], 
    public datatypeProperty: string,
    public shortName: string,
    public disambiguation: number,
    public description: string,
    public uuid: string,
    public isGroup: boolean,
    public name: string
  ) {

  }

  static create (): Path {
    return new Path(
      '', -1, false, '', '', '', '', '', '', -1, '', [], '', '', -1, '', '', false, ''
    )
  }

  public getInformativeFieldType (): string {
    if (this.fieldTypeInformative !== '') {
      return this.fieldTypeInformative
    }
    return this.fieldType
  }

  public getDisambiguation (): string | null {
    const index = 2 * this.disambiguation - 2
    return this.pathArray[index] ?? null
  }

  private static parseValue<T>(element: Element, name: string, parser: (value: string) => T): T {
    const children = Array.from(element.childNodes).filter(node => node.nodeName === name)
    if (children.length > 1) {
      throw new Error(`expected exactly one <${name}> child, but got ${children.length}`)
    }

    // if there are no children, pretend it is empty
    if (children.length === 0) {
      return parser('')
    }

    return parser(
      Array.from(children[0].childNodes).map(e => e.nodeType === e.TEXT_NODE ? e.textContent : '').join('')
    )
  }

  private static parsePathArray (element: Element): string[] {
    const children = Array.from(element.childNodes).filter(node => node.nodeName === 'path_array')
    if (children.length === 0) {
      throw new Error('expected exactly one <path_array> child')
    }
    return Array.from(children[0].childNodes)
      .filter(node => node.nodeType === node.ELEMENT_NODE)
      .map((p, i) => {
        const want = (i % 2 === 0) ? 'x' : 'y'
        const got = p.nodeName[0].toLowerCase()
        if (got !== want) {
          throw new Error(`expected a <${want}>, but got a <${got}>`)
        }
        return p.textContent ?? ''
      })
  }

  static fromNode (node: Element): Path {
    if (node.nodeName !== 'path') {
      throw new Error(`expected a <path>, but got a <${node.nodeName}>`)
    }

    const p = this.parseValue.bind(this, node) as <T>(f: string, p: (v: string) => T) => T

    const str = (value: string): string => value
    const str0 = (value: string): string => {
      if (value === '0') return ''
      return value
    }
    const strEmpty = (value: string): string => {
      if (value === 'empty') return ''
      return value
    }
    const int = (value: string): number => {
      if (value.trim() === '') {
        return 0
      }

      const i = parseInt(value, 10)
      if (isNaN(i)) {
        throw new Error(`expected an integer, but got ${value}`)
      }
      return i
    }
    const bool = (value: string): boolean => {
      const b = int(value)
      return b !== 0
    }

    return new Path(
      p('id', str),
      p('weight', int),
      p('enabled', bool),
      p('group_id', str0),

      p('bundle', str),
      p('field', str),
      p('fieldtype', str),
      p('displaywidget', str),
      p('formatterwidget', str),
      p('cardinality', int),
      p('field_type_informative', str),

      this.parsePathArray(node),
      p('datatype_property', strEmpty),
      p('short_name', str),
      p('disamb', int),
      p('description', str),
      p('uuid', str),
      p('is_group', bool),
      p('name', str)
    )
  }

  private static serializeElement<T>(xml: XMLDocument, path: Element, name: string, serializer: (value: T) => string, value: T): void {
    const element = xml.createElement(name)
    element.appendChild(xml.createTextNode(serializer(value)))
    path.appendChild(element)
  }

  toXML (xml: XMLDocument): Element {
    const path = xml.createElement('path')

    const str = (value: string): string => value
    const str0 = (value: string): string => {
      if (value === '') return '0'
      return value
    }
    const strEmpty = (value: string): string => {
      if (value === '') return 'empty'
      return value
    }
    const int = (value: number): string => {
      return value.toString()
    }
    const bool = (value: boolean): string => {
      return value ? '1' : '0'
    }

    const s = Path.serializeElement.bind(Path, xml, path) as <T>(f: string, s: (v: T) => string, v: T) => void

    s('id', str, this.id)
    s('weight', int, this.weight)
    s('enabled', bool, this.enabled)
    s('group_id', str0, this.groupId)

    s('bundle', str, this.bundle)
    s('field', str, this.field)
    s('fieldtype', str, this.fieldType)
    s('displaywidget', str, this.displayWidget)
    s('formatterwidget', str, this.formatterWidget)
    s('cardinality', int, this.cardinality)
    s('field_type_informative', str, this.fieldTypeInformative)

    const pathArray = xml.createElement('path_array')
    path.appendChild(pathArray)

    this.pathArray.forEach((p, i) => {
      const xy = xml.createElement(i % 2 === 0 ? 'x' : 'y')
      xy.appendChild(xml.createTextNode(p))
      pathArray.appendChild(xy)
    })

    s('datatype_property', strEmpty, this.datatypeProperty)
    s('short_name', str, this.shortName)
    s('disamb', int, this.disambiguation)
    s('description', str, this.description)
    s('uuid', str, this.uuid)
    s('is_group', bool, this.isGroup)
    s('name', str, this.name)

    return path
  }
}

// spellchecker:words disamb pathbuilderinterface fieldtype displaywidget formatterwidget 