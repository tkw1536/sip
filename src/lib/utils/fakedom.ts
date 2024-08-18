/** checks if the given node is an element */
export function isElement(n: Node): n is Element {
  return n.nodeType === n.ELEMENT_NODE
}

/** isTag checks if the given element is an element with the given TagName  */
export function isTag<E extends Element>(
  node: Node,
  tagName: E['tagName'],
): node is E {
  return isElement(node) && node.tagName.toUpperCase() === tagName.toUpperCase()
}

export function cloneNodeInDocument(document: Document, node: Node): Node {
  // if we already own the node, we can just do a plain clone!
  if (document === node.ownerDocument) {
    return node.cloneNode(true)
  }

  // if the document can adopt nodes, we can just adopt the clone
  if (typeof document.adoptNode === 'function') {
    const clone = node.cloneNode(true)
    document.adoptNode(clone)
    return clone
  }

  switch (node.nodeType) {
    case document.ELEMENT_NODE: {
      const origElement = node as Element

      const element = document.createElement(origElement.nodeName)
      for (let i = 0; i < origElement.attributes.length; i++) {
        const attribute = origElement.attributes[i]
        element.setAttribute(attribute.name, attribute.value)
      }
      for (let i = 0; i < origElement.childNodes.length; i++) {
        const child = origElement.childNodes[i]
        element.appendChild(cloneNodeInDocument(document, child))
      }
      return element
    }
    case document.TEXT_NODE:
      return document.createTextNode((node as Text).data)
    case document.CDATA_SECTION_NODE:
      return document.createCDATASection((node as CDATASection).data)
    case document.PROCESSING_INSTRUCTION_NODE:
      return document.createProcessingInstruction(
        (node as ProcessingInstruction).target,
        (node as ProcessingInstruction).data,
      )
    case document.COMMENT_NODE:
      return document.createComment((node as Comment).data)
  }

  console.warn('cloneNodeInDocument: falling back to native implementation')
  return node.cloneNode(true)
}
