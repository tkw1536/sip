enum Deduplication {
  Full = 'full',
  Bundle = 'bundle',
  Parents = 'parents',
  None = 'none',
}
export default Deduplication

export const defaultValue = Deduplication.Bundle

type Info = Record<Deduplication, string>

export const names = Object.freeze<Info>({
  [Deduplication.Full]: 'Full',
  [Deduplication.Bundle]: 'Bundle',
  [Deduplication.Parents]: 'Parents',
  [Deduplication.None]: 'None',
})
export const values = Array.from(Object.keys(names) as Deduplication[])
export const explanations = Object.freeze<Info>({
  [Deduplication.Full]:
    'Draw each class at most once. This corresponds to drawing a subset of the associated ontology with their domains and ranges',
  [Deduplication.Bundle]: 'Draw nodes once within the current bundle',
  [Deduplication.Parents]: 'Only deduplicate shared parent paths',
  [Deduplication.None]: 'Do not deduplicate nodes at all',
})
