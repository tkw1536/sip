import {
  Component,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact'
import * as styles from './tabs.module.css'
import { WithID } from './wrapper'
import { classes } from '../utils/classes'

interface TabProps {
  title: string
  id: string
  disabled?: boolean
  children: ComponentChildren
}
export class Tab extends Component<TabProps> {
  render(): ComponentChildren {
    return this.props.children
  }
}

interface LabelProps {
  children?: ComponentChildren
}
export class Label extends Component<LabelProps> {
  render(): ComponentChildren {
    return this.props.children
  }
}

type TabChild = ({ type: 'label' } & LabelProps) | ({ type: 'tab' } & TabProps)

interface TabsProps {
  active: string
  onChangeTab: (id: string) => void
}
export default class Tabs extends Component<TabsProps> {
  /** getChildren returns an array of VNode<any> children */
  static #getChildren(children: ComponentChildren): Array<VNode<any>> {
    return toChildArray(children).filter(
      (child): child is VNode<any> =>
        child !== null &&
        typeof child === 'object' &&
        Object.prototype.hasOwnProperty.call(child, 'type') &&
        typeof child.type !== 'undefined',
    )
  }

  get children(): TabChild[] {
    return Tabs.#getChildren(this.props.children)
      .map(c => {
        if (c.type === Tab) {
          return { type: 'tab', ...c.props }
        }
        if (c.type === Label) {
          return { type: 'label', ...c.props }
        }
        return null
      })
      .filter(c => c !== null)
  }

  render(): ComponentChildren {
    const { active, onChangeTab } = this.props
    return (
      <TabInterface active={active} onChangeTab={onChangeTab}>
        {this.children}
      </TabInterface>
    )
  }
}

type TabInterfaceProps = { children: TabChild[]; id: string } & TabsProps

const TabInterface = WithID<TabInterfaceProps>(
  class TabInterface extends Component<TabInterfaceProps> {
    readonly #handleTabChange = (id: string, event: MouseEvent): void => {
      event.preventDefault()

      const tab = this.#findTab(id)
      if (tab === null || (tab.disabled ?? false)) return
      this.props.onChangeTab(id)
    }

    readonly #findTab = (id: string): TabProps | null => {
      const candidate = this.props.children.find(
        (child): child is TabChild & { type: 'tab' } => {
          return child.type === 'tab' && id === child.id
        },
      )
      return candidate ?? null
    }

    render(): ComponentChildren {
      const { active, children } = this.props

      return (
        <div class={styles.container}>
          <ul role='tablist' class={styles.list}>
            {children.map((child, index) => {
              if (child.type === 'label') {
                return (
                  <li key={index} class={styles.label}>
                    <Label {...child} />
                  </li>
                )
              }

              const { disabled, title, id } = child
              const selected = id === active
              const clz = classes(
                styles.tab,
                (disabled ?? false) && styles.disabled,
                selected && styles.selected,
              )
              const handleClick = this.#handleTabChange.bind(this, id)

              const tabID = `${id}-tab-${index}`
              const panelID = `${id}-panel-${index}`

              return (
                <li
                  role='tab'
                  onClick={handleClick}
                  id={tabID}
                  tabindex={0}
                  key={index}
                  aria-selected={selected}
                  aria-disabled={disabled}
                  class={clz}
                  aria-controls={panelID}
                >
                  {title}
                </li>
              )
            })}
          </ul>

          {children.map((child, index) => {
            if (child.type === 'label') return null

            const { disabled, children, id } = child

            const selected = id === active
            const visible = selected && !(disabled ?? false)

            const clz = classes(styles.panel, visible && styles.selected)
            const childNodes = visible ? children : null

            const tabID = `${id}-tab-${index}`
            const panelID = `${id}-panel-${index}`

            return (
              <div
                role='tabpanel'
                key={index}
                id={panelID}
                aria-labelledby={tabID}
                class={clz}
              >
                {childNodes}
              </div>
            )
          })}
        </div>
      )
    }
  },
)
