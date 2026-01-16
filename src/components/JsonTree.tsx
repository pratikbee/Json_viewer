import { useState } from 'react'
import './JsonTree.css'

interface JsonTreeProps {
  data: any
  name?: string
  level?: number
  path?: string[]
  onHoist?: (path: string[], data: any) => void
  isVisible?: boolean
}

function JsonTree({ 
  data, 
  name, 
  level = 0, 
  path = [], 
  onHoist,
  isVisible = true
}: JsonTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const indent = level * 20

  const getValueType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  const renderValue = (value: any, type: string) => {
    switch (type) {
      case 'string':
        return <span className="value-string">"{value}"</span>
      case 'number':
        return <span className="value-number">{value}</span>
      case 'boolean':
        return <span className="value-boolean">{value.toString()}</span>
      case 'null':
        return <span className="value-null">null</span>
      default:
        return null
    }
  }

  const handleCopy = (value: any) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    navigator.clipboard.writeText(text)
  }

  const type = getValueType(data)

  const handleHoist = () => {
    if (onHoist) {
      onHoist(path, data)
    }
  }

  if (type === 'object' || type === 'array') {
    const entries = type === 'array' 
      ? data.map((item: any, index: number) => [String(index), item])
      : Object.entries(data).map(([key, value]) => [String(key), value])
    const isEmpty = entries.length === 0

    if (!isVisible) {
      return null
    }

    return (
      <div className="json-node tree-node">
        <div className="node-wrapper">
          {level > 0 && (
            <div className="tree-connector">
              <div className="tree-line-vertical"></div>
              <div className="tree-line-horizontal"></div>
            </div>
          )}
          <div className="node-content">
            <div className="node-header">
              <button
                className="expand-button"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isEmpty}
              >
                <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              {name !== undefined && (
                <span className="key-name">{name}:</span>
              )}
              <span className="type-badge">
                {type === 'array' ? `Array[${entries.length}]` : `Object{${entries.length}}`}
              </span>
              {isEmpty && <span className="empty-indicator">empty</span>}
              {onHoist && (
                <button
                  className="hoist-button"
                  onClick={handleHoist}
                  title="Focus on this node (hide everything else)"
                >
                  <span className="hoist-icon">🎯</span>
                  Focus
                </button>
              )}
            </div>

            {isExpanded && !isEmpty && (
              <div className="node-children">
                {entries.map(([key, value]: [any, any], index: number) => {
                  const isLastChild = index === entries.length - 1
                  const childPath = type === 'array' 
                    ? [...path, `[${key}]`]
                    : [...path, key]
                  return (
                    <div key={key} className={`tree-child ${isLastChild ? 'last-child' : ''}`}>
                      <JsonTree
                        data={value}
                        name={type === 'array' ? undefined : key}
                        level={level + 1}
                        path={childPath}
                        onHoist={onHoist}
                        isVisible={isVisible}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="json-node leaf-node">
      <div className="node-wrapper">
        {level > 0 && (
          <div className="tree-connector">
            <div className="tree-line-vertical"></div>
            <div className="tree-line-horizontal"></div>
            <div className="tree-dot"></div>
          </div>
        )}
        <div className="node-content">
          <div className="node-header">
            {name !== undefined && <span className="key-name">{name}:</span>}
            {renderValue(data, type)}
            <button
              className="copy-button"
              onClick={() => handleCopy(data)}
              title="Copy value"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JsonTree
