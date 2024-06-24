import StackTrace from 'stacktrace-js'
export default async function formatError (err: unknown): Promise<string> {
  if (err instanceof Error) {
    return await formatErrorInstance(err)
  }
  return formatNonError(err)
}

function formatNonError (err: unknown): string {
  if (typeof err === 'undefined') {
    return 'undefined'
  }
  if (err === null) {
    return 'null'
  }
  if (typeof err === 'string') {
    return err
  }

  return Object.prototype.toString.call(err)
}

async function formatErrorInstance (err: Error): Promise<string> {
  try {
    const { name, message, stack, cause } = err

    const lines = [
      name + ': ' + JSON.stringify(message)
    ]

    if (typeof stack === 'string') {
      const stackErr = await StackTrace.fromError(err)
        .then(stack => stack.map(f => f.toString()).join('\n'))
        .catch(() => stack)
      lines.push('')
      lines.push('Stack Trace: ')
      lines.push(stackErr)
    }

    if (typeof cause !== 'undefined') {
      lines.push('')
      lines.push('Caused by: ')
      lines.push(await formatError(cause))
    }

    return lines.join('\n')
  } catch (e: unknown) {
    return '(error formatting error)'
  }
}
