import { Component, ComponentChildren, VNode } from 'preact'
import * as styles from './tabs.module.css'
import { WithID } from './wrapper'
import { classes } from '../utils/classes'

interface TabProps { title: string, disabled?: boolean, children: ComponentChildren }
export class Tab extends Component<TabProps> {
  render (): ComponentChildren {
    return this.props.children
  }
}

interface LabelProps { children?: ComponentChildren }
export class Label extends Component<LabelProps> {
  render (): ComponentChildren {
    return this.props.children
  }
}

type TabChild = { 'type': 'label' } & LabelProps | { 'type': 'tab' } & TabProps

interface TabsProps { activeIndex: number, onChangeTab: (index: number) => void }
export default class Tabs extends Component<TabsProps> {
  /** getChildren returns an array of VNode<any> children */
  private static getChildren (children: ComponentChildren): Array<VNode<any>> {
    return (Array.isArray(children) ? children : [children])
      .filter(child =>
        child !== null && typeof child === 'object' &&
                Object.prototype.hasOwnProperty.call(child, 'type') && typeof child.type !== 'undefined'
      )
  }

  private readonly getChildren = (): TabChild[] => {
    return Tabs.getChildren(this.props.children).map(c => {
      if (c.type === Tab) {
        return { type: 'tab', ...c.props }
      }
      if (c.type === Label) {
        return { type: 'label', ...c.props }
      }
      return null
    }).filter(c => c !== null)
  }

  render (): ComponentChildren {
    const { activeIndex, onChangeTab } = this.props
    const tabs = this.getChildren()
    return <TabInterface activeIndex={activeIndex} onChangeTab={onChangeTab}>{tabs}</TabInterface>
  }
}

type TabInterfaceProps = { children: TabChild[], id: string } & TabsProps

const TabInterface = WithID<TabInterfaceProps>(class TabInterface extends Component<TabInterfaceProps> {
  private readonly handleTabChange = (newIndex: number, event: MouseEvent): void => {
    event.preventDefault()

    if (!this.isSelectableTabIndex(newIndex)) return
    this.props.onChangeTab(newIndex)
  }

  private readonly isSelectableTabIndex = (index: number): boolean => {
    let tabIndex = 0
    const candidate = this.props.children.find(({ type }) => {
      if (type === 'label') return false
      return index === tabIndex++
    })
    if (typeof candidate === 'undefined' || candidate.type === 'label') return false
    return !(candidate.disabled ?? false)
  }

  private readonly children = (): Array<[TabProps, number, null] | [LabelProps, null, number]> => {
    let tabIndex = 0
    let labelIndex = 0
    return this.props.children.map(({ type, ...props }) => {
      if (type === 'label') return [props, null, labelIndex++] as [LabelProps, null, number]
      return [props, tabIndex++, null] as [TabProps, number, null]
    })
  }

  render (): ComponentChildren {
    const { activeIndex, id } = this.props
    const children = this.children()

    return (
      <div class={styles.container}>
        <ul role='tablist' class={styles.list}>
          {children.map(([child, tabIndex, labelIndex]) => {
            if (labelIndex !== null) {
              return <li key={`label-${labelIndex}`} class={styles.label}><Label {...child} /></li>
            }

            const { disabled, title } = child
            const selected = tabIndex === activeIndex
            const clz = classes(
              styles.tab,
              (disabled ?? false) && styles.disabled,
              selected && styles.selected
            )
            const handleClick = this.handleTabChange.bind(this, tabIndex)

            const tabID = `${id}-tab-${tabIndex}`
            const panelID = `${id}-panel-${tabIndex}`

            return <li role='tab' onClick={handleClick} id={tabID} tabindex={0} key={tabIndex} aria-selected={selected} aria-disabled={disabled} class={clz} aria-controls={panelID}>{title}</li>
          })}
        </ul>

        {children.map(([child, tabIndex, labelIndex]) => {
          if (labelIndex !== null) return null

          const { disabled, children } = child

          const selected = tabIndex === activeIndex
          const visible = selected && !(disabled ?? false)

          const clz = classes(styles.panel, visible && styles.selected)
          const childNodes = visible ? children : null

          const tabID = `${id}-tab-${tabIndex}`
          const panelID = `${id}-panel-${tabIndex}`

          return <div role='tabpanel' key={tabIndex} id={panelID} aria-labelledby={tabID} class={clz}>{childNodes}</div>
        })}
      </div>
    )
  }
})
