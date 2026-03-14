export type CardFieldDef = {
  key: string
  label: string
  multiline?: boolean
  type?: 'image' | 'url' | 'boolean'
}

export type EditTarget =
  | {
      type: 'text'
      sectionKey: string
      fieldPath: string
      label: string
      value: string
      multiline?: boolean
      rect: DOMRect
    }
  | {
      type: 'image'
      sectionKey: string
      fieldPath: string
      value: string
      rect: DOMRect
    }
  | {
      type: 'card'
      sectionKey: string
      arrayField: string
      index: number
      item: Record<string, unknown>
      cardFields: CardFieldDef[]
      rect: DOMRect
    }

export interface SectionEditCallbacks {
  onTextClick: (
    e: React.MouseEvent,
    fieldPath: string,
    label: string,
    value: string,
    multiline?: boolean
  ) => void
  onImageClick: (e: React.MouseEvent, fieldPath: string, value: string) => void
  onCardClick: (
    e: React.MouseEvent,
    arrayField: string,
    index: number,
    item: Record<string, unknown>,
    fields: CardFieldDef[]
  ) => void
  activeTarget: EditTarget | null
}
