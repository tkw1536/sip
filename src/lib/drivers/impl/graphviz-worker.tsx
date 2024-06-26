import { type Graph, instance, type RenderOptions } from '@viz-js/viz'

export interface GraphVizRequest {
  input: string | Graph
  options: RenderOptions
}
export type GraphVizResponse = { success: true, result: string } | { success: false, message: string }

onmessage = function (e) {
  processMessage(e.data)
    .then(result => {
      const message: GraphVizResponse = { success: true, result }
      postMessage(message)
    })
    .catch(err => {
      const message: GraphVizResponse = { success: false, message: formatError(err) }
      postMessage(message)
    })
}

async function processMessage (data: any): Promise<string> {
  if (!isRequest(data)) {
    throw new Error('invalid request received')
  }

  return await processRequest(data)
}

function isRequest (data: any): data is GraphVizRequest {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  return Object.hasOwn(data, 'input') && Object.hasOwn(data, 'options')
}

async function processRequest (request: GraphVizRequest): Promise<string> {
  const result = (await instance()).render(request.input, request.options)
  if (result.status !== 'success') {
    const message = 'render() returned failure: \n' + result.errors.map(formatError).join('\n')
    throw new Error(message)
  }
  return result.output
}

function formatError (err: unknown): string {
  if (Object.hasOwn(err as any, 'message')) {
    return (err as any).message
  }
  return String(err)
}
