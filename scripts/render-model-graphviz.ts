import { ArgumentParser } from 'argparse'
import { readFile } from 'fs/promises'
import { Pathbuilder } from '../src/lib/pathbuilder/pathbuilder'
import { PathTree } from '../src/lib/pathbuilder/pathtree'
import { NamespaceMap } from '../src/lib/pathbuilder/namespace'
import ColorMap from '../src/lib/pathbuilder/annotations/colormap'
import ModelGraphBuilder from '../src/lib/graph/builders/model'
import Deduplication from '../src/app/inspector/state/state/deduplication'
import { GraphVizModelDriver } from '../src/lib/drivers/impl/graphviz'
import { type ContextFlags } from '../src/lib/drivers/impl'

// Usage: node node_modules/vite-node/vite-node.mjs ./scripts/render-model-graphviz.ts -p pathbuilder

async function main(): Promise<void> {
  const parser = new ArgumentParser()

  parser.add_argument('--pathbuilder', '-p', { required: true })

  const config = parser.parse_args()

  // parse the pathbuilder as xml
  const pbXML = await readFile(config.pathbuilder as string)
  const pb = Pathbuilder.parse(pbXML.toString())

  // create a tree
  const tree = PathTree.fromPathbuilder(pb)

  // generate a colormap
  const ns = NamespaceMap.generate(tree.uris)
  const cm = ColorMap.generate(tree, { field: '#f6b73c', bundle: '#add8e6' })

  // build the actual graph
  const graph = await new ModelGraphBuilder(tree, {
    deduplication: Deduplication.Full,
  }).build()

  // load the driver and setup flags to use
  const driver = new GraphVizModelDriver(false)
  const flags: ContextFlags = {
    ns,
    cm,
    definitelyAcyclic: false,
    layout: driver.supportedLayouts[0],
    initialSize: { width: 1000, height: 1000 },
  }

  // finally create the blob
  const ctx = await driver.makeContext(flags, graph, () => true)
  const blob = await driver.export(ctx, flags, 'svg', undefined)

  // write the actual blob to the console
  process.stdout.write(await blob.text())
}
main().catch(err => {
  console.log(err)
})

// spellchecker:words argparse
