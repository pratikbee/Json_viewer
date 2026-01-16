import { useState } from 'react'
import JsonTree from './components/JsonTree'
import Breadcrumbs from './components/Breadcrumbs'
import './App.css'

function App() {
  const [jsonInput, setJsonInput] = useState('')
  const [jsonData, setJsonData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hoistedData, setHoistedData] = useState<any>(null)
  const [hoistedPath, setHoistedPath] = useState<string[]>([])

  // Normalize JSON to convert non-string keys to strings
  const normalizeKeys = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(normalizeKeys)
    }

    const normalized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Convert key to string if it's not already
      const stringKey = String(key)
      normalized[stringKey] = normalizeKeys(value)
    }
    return normalized
  }

  const handleInputChange = (value: string) => {
    setJsonInput(value)
    setError(null)
    setHoistedData(null)
    setHoistedPath([])
    
    if (value.trim() === '') {
      setJsonData(null)
      return
    }

    try {
      const parsed = JSON.parse(value)
      // Normalize keys to ensure all keys are strings
      const normalized = normalizeKeys(parsed)
      setJsonData(normalized)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
    }
  }

  const formatJSON = () => {
    if (!jsonInput.trim()) {
      return
    }

    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
      setError(null)
      // Update the tree view with the formatted data
      const normalized = normalizeKeys(parsed)
      setJsonData(normalized)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
    }
  }

  const handleHoist = (path: string[], data: any) => {
    setHoistedData(data)
    setHoistedPath(path)
  }

  const handleResetHoist = () => {
    setHoistedData(null)
    setHoistedPath([])
  }

  const handleBreadcrumbNavigate = (index: number) => {
    if (hoistedData) {
      // If navigating to root of hoisted, reset hoist
      if (index < 0) {
        handleResetHoist()
      }
      // Otherwise, navigate within hoisted path by updating hoisted path
      const newPath = hoistedPath.slice(0, index + 1)
      if (newPath.length === 0) {
        handleResetHoist()
      } else {
        // Re-hoist to the new path location
        // We need to find the data at this path
        let currentData = jsonData
        for (const segment of newPath) {
          if (segment.startsWith('[') && segment.endsWith(']')) {
            // Array index
            const index = parseInt(segment.slice(1, -1))
            currentData = currentData[index]
          } else {
            // Object key
            currentData = currentData[segment]
          }
        }
        setHoistedData(currentData)
        setHoistedPath(newPath)
      }
    }
  }

  const loadSampleData = () => {
    const sample = {
      name: "John Doe",
      age: 30,
      address: {
        street: "123 Main St",
        city: "New York",
        zip: "10001",
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      },
      hobbies: ["reading", "coding", "traveling"],
      active: true,
      metadata: {
        created: "2024-01-01",
        tags: ["user", "premium"],
        settings: {
          theme: "dark",
          notifications: true
        }
      }
    }
    const sampleString = JSON.stringify(sample, null, 2)
    setJsonInput(sampleString)
    setJsonData(sample)
    setError(null)
    setHoistedData(null)
    setHoistedPath([])
  }

  // Get the data to display (hoisted or full)
  const displayData = hoistedData || jsonData
  // Show hoisted path in breadcrumbs
  const breadcrumbPath = hoistedPath

  return (
    <div className="app">
      <header className="app-header">
        <h1>JSON Tree Visualizer</h1>
        <p>Paste or type your JSON to visualize it as a tree</p>
        <button onClick={loadSampleData} className="sample-button">
          Load Sample Data
        </button>
      </header>
      
      <div className="app-container">
        <div className="input-panel">
          <div className="panel-header">
            <h2>JSON Input</h2>
            <button 
              onClick={formatJSON} 
              className="format-button"
              title="Format JSON"
              disabled={!jsonInput.trim()}
            >
              <span className="format-icon">✨</span>
              Format
            </button>
          </div>
          <textarea
            className={`json-input ${error ? 'error' : ''}`}
            value={jsonInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste your JSON here..."
            spellCheck={false}
          />
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <h2>Tree View</h2>
          </div>
          <div className="tree-container">
            {displayData ? (
              <>
                <Breadcrumbs
                  path={breadcrumbPath}
                  onNavigate={handleBreadcrumbNavigate}
                  onReset={handleResetHoist}
                  isHoisted={!!hoistedData}
                />
                <div className="tree-content">
                  <JsonTree
                    data={displayData}
                    path={[]}
                    onHoist={handleHoist}
                    isVisible={true}
                  />
                </div>
              </>
            ) : (
              <div className="empty-state">
                {error ? (
                  <p className="error-text">Invalid JSON format</p>
                ) : (
                  <>
                    <p>Enter JSON to visualize</p>
                    <p className="hint">Try the sample data button above!</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
