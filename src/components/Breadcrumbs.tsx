import './Breadcrumbs.css'

interface BreadcrumbsProps {
  path: string[]
  onNavigate: (index: number) => void
  onReset: () => void
  isHoisted: boolean
}

function Breadcrumbs({ path, onNavigate, onReset, isHoisted }: BreadcrumbsProps) {
  if (path.length === 0 && !isHoisted) {
    return null
  }

  return (
    <div className="breadcrumbs-container">
      <div className="breadcrumbs">
        {isHoisted && (
          <>
            <button 
              className="breadcrumb-item breadcrumb-reset"
              onClick={onReset}
              title="Reset to root view"
            >
              <span className="breadcrumb-icon">🏠</span>
              Root
            </button>
            {path.length > 0 && <span className="breadcrumb-separator">›</span>}
          </>
        )}
        {path.map((segment, index) => (
          <span key={index} className="breadcrumb-group">
            <span className="breadcrumb-separator">›</span>
            <button
              className="breadcrumb-item"
              onClick={() => onNavigate(index)}
              title={`Navigate to ${segment}`}
            >
              {segment}
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export default Breadcrumbs
