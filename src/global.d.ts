declare module '*.module.css' {
  const classes: Record<string, string>
  export = classes
}

declare module 'bundle-text:*' {
  const content: string
  export = content
}

declare module 'cytoscape-cola' {
  import * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-dagre' {
  import * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-fcose' {
  import * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-avsdf' {
  import * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}

// spellchecker:words avsdf fcose dagre
