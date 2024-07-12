// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite-plugin-compile-time/client" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite/client" />
declare module '*.module.css' {
  const classes: Record<string, string>
  export = classes
}

declare module 'cytoscape-cola' {
  import type * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-dagre' {
  import type * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-fcose' {
  import type * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
declare module 'cytoscape-avsdf' {
  import type * as cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}

declare module 'preact/debug' {}

// spellchecker:words avsdf fcose dagre
