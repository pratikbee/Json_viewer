# JSON Tree Visualizer - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Structure](#component-structure)
4. [Data Flow](#data-flow)
5. [Core Features & Implementation](#core-features--implementation)
6. [UI/UX Features](#uiux-features)
7. [State Management](#state-management)
8. [Styling Architecture](#styling-architecture)
9. [Key Algorithms](#key-algorithms)

---

## Overview

The JSON Tree Visualizer is a React-based web application that parses JSON input and renders it as an interactive, hierarchical tree structure. It provides features for navigation, focusing on specific data sections, and formatting JSON input.

**Tech Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** CSS3 with custom properties
- **State Management:** React Hooks (useState)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    App Component                        │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  Input Panel     │      │  Output Panel    │       │
│  │  - Textarea      │      │  - Breadcrumbs   │       │
│  │  - Format Button │      │  - JsonTree      │       │
│  │  - Error Display │      │  (Recursive)     │       │
│  └──────────────────┘      └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── App Header
│   └── Sample Data Button
├── Input Panel
│   ├── Panel Header
│   │   └── Format Button
│   ├── Textarea (JSON Input)
│   └── Error Message (conditional)
└── Output Panel
    ├── Panel Header
    ├── Breadcrumbs (conditional)
    └── Tree Content
        └── JsonTree (recursive)
            ├── Tree Node (Object/Array)
            │   ├── Expand Button
            │   ├── Key Name
            │   ├── Type Badge
            │   ├── Hoist Button
            │   └── Node Children
            │       └── JsonTree (recursive children)
            └── Leaf Node (Primitive)
                ├── Key Name
                ├── Value Display
                └── Copy Button
```

---

## Component Structure

### 1. App Component (`src/App.tsx`)

**Purpose:** Main application container managing global state and orchestration.

**State Management:**
```typescript
- jsonInput: string          // Raw JSON string from textarea
- jsonData: any              // Parsed and normalized JSON object
- error: string | null       // JSON parsing error message
- hoistedData: any           // Currently focused/hoisted data subset
- hoistedPath: string[]      // Path to hoisted data in original JSON
```

**Key Functions:**

#### `normalizeKeys(obj: any): any`
**Purpose:** Recursively converts all object keys to strings, ensuring consistent key handling.

**Algorithm:**
1. Base case: If value is null or not an object, return as-is
2. Array case: Map over array, recursively normalize each element
3. Object case:
   - Create new normalized object
   - Iterate through entries
   - Convert each key to string using `String(key)`
   - Recursively normalize each value
   - Return normalized object

**Why it's needed:** JavaScript objects can have numeric keys, but JSON keys are always strings. This ensures consistent display and path tracking.

#### `handleInputChange(value: string)`
**Purpose:** Handles real-time JSON input changes with validation.

**Flow:**
1. Update `jsonInput` state
2. Clear previous error
3. Reset hoist state (new input = new tree)
4. If input is empty, clear `jsonData` and return
5. Try to parse JSON:
   - Success: Normalize keys and set `jsonData`
   - Failure: Set error message

**Error Handling:** Catches `JSON.parse` errors and displays them in the error message component.

#### `formatJSON()`
**Purpose:** Formats JSON input with proper indentation.

**Flow:**
1. Check if input exists
2. Parse JSON (validates it)
3. Stringify with 2-space indentation
4. Update `jsonInput` with formatted string
5. Update `jsonData` with normalized parsed data
6. Clear errors

**Result:** User sees properly formatted JSON in textarea, and tree updates automatically.

#### `handleHoist(path: string[], data: any)`
**Purpose:** Implements "Focus Mode" - isolates a specific node as the root.

**Flow:**
1. Receives path and data from clicked node
2. Sets `hoistedData` to the selected node's data
3. Sets `hoistedPath` to the path from root to selected node
4. Tree re-renders showing only the hoisted branch

**Use Case:** When user clicks "Focus" button on a node, that node becomes the new root, hiding all other data.

#### `handleResetHoist()`
**Purpose:** Returns from focus mode to full tree view.

**Flow:**
1. Clears `hoistedData` (sets to null)
2. Clears `hoistedPath` (sets to empty array)
3. Tree re-renders showing full JSON structure

#### `handleBreadcrumbNavigate(index: number)`
**Purpose:** Navigates through breadcrumb path when in hoisted mode.

**Algorithm:**
1. If `index < 0` (Root button clicked), reset hoist
2. Calculate new path: `hoistedPath.slice(0, index + 1)`
3. If new path is empty, reset hoist
4. Otherwise, traverse original `jsonData` to find data at new path:
   - For each segment in path:
     - If segment is array index (format: `[0]`), parse index and access array
     - If segment is object key, access object property
   - Set new hoisted data and path

**Path Traversal Logic:**
```typescript
let currentData = jsonData
for (const segment of newPath) {
  if (segment.startsWith('[') && segment.endsWith(']')) {
    // Array index: "[0]" -> 0
    const index = parseInt(segment.slice(1, -1))
    currentData = currentData[index]
  } else {
    // Object key: "address"
    currentData = currentData[segment]
  }
}
```

---

### 2. JsonTree Component (`src/components/JsonTree.tsx`)

**Purpose:** Recursively renders JSON data as a visual tree structure.

**Props Interface:**
```typescript
interface JsonTreeProps {
  data: any              // The JSON value to render
  name?: string          // Key name (undefined for root or array items)
  level?: number         // Depth level (0 = root)
  path?: string[]        // Array path from root: ["address", "coordinates"]
  onHoist?: Function     // Callback to hoist this node
  isVisible?: boolean    // Visibility flag (for filtering)
}
```

**State:**
```typescript
- isExpanded: boolean    // Whether node is expanded (default: level < 2)
```

#### Recursive Rendering Logic

**Type Detection:**
```typescript
getValueType(value: any): string
```
- Returns: `'null'`, `'array'`, `'object'`, `'string'`, `'number'`, `'boolean'`

**Rendering Decision Tree:**

```
Is data an object or array?
├── YES → Render as Tree Node
│   ├── Check if visible
│   ├── Render expand button
│   ├── Render key name (if exists)
│   ├── Render type badge (Array[3] or Object{5})
│   ├── Render hoist button (if onHoist provided)
│   └── If expanded:
│       └── Map over entries
│           └── For each entry:
│               ├── Calculate child path
│               ├── Determine if last child
│               └── Recursively render JsonTree
│
└── NO → Render as Leaf Node
    ├── Check if visible
    ├── Render key name (if exists)
    ├── Render formatted value
    └── Render copy button
```

#### Path Building Algorithm

**For Arrays:**
```typescript
childPath = [...path, `[${key}]`]
// Example: [] → ["[0]"] → ["[0]", "[1]"]
```

**For Objects:**
```typescript
childPath = [...path, key]
// Example: [] → ["address"] → ["address", "street"]
```

**Path Format:**
- Root: `[]`
- Object key: `["address"]`
- Array index: `["[0]"]`
- Nested: `["address", "coordinates", "lat"]`
- Mixed: `["hobbies", "[0]"]`

#### Expand/Collapse Logic

**Initial State:**
- Nodes at level 0-1: Expanded by default (`level < 2`)
- Deeper nodes: Collapsed by default

**Toggle:**
- Click expand button → `setIsExpanded(!isExpanded)`
- When expanded: Render children recursively
- When collapsed: Hide children

#### Value Rendering

**Primitive Value Formatting:**
```typescript
renderValue(value: any, type: string)
```

- **String:** Wrapped in quotes: `"value"`
- **Number:** Displayed as-is: `42`
- **Boolean:** Converted to string: `true` / `false`
- **Null:** Displayed as: `null`

**CSS Classes Applied:**
- `value-string` → Soft Sage Green
- `value-number` → Sky Blue
- `value-boolean` → Coral Pink
- `value-null` → Gray italic

#### Copy Functionality

**Implementation:**
```typescript
handleCopy(value: any)
```

1. If value is string: Copy directly
2. If value is object/array: Stringify with 2-space indentation
3. Use `navigator.clipboard.writeText()` API
4. Button appears on hover for leaf nodes

---

### 3. Breadcrumbs Component (`src/components/Breadcrumbs.tsx`)

**Purpose:** Displays navigation path and allows navigation through hoisted tree.

**Props:**
```typescript
- path: string[]           // Current path segments
- onNavigate: Function     // Callback when breadcrumb clicked
- onReset: Function        // Callback when Root clicked
- isHoisted: boolean       // Whether in hoisted/focus mode
```

**Rendering Logic:**

1. **Visibility:** Only shows if `path.length > 0` OR `isHoisted === true`

2. **Root Button:**
   - Shown when `isHoisted === true`
   - Clicking calls `onReset()` to return to full view
   - Styled differently (green gradient)

3. **Path Segments:**
   - Maps over `path` array
   - Each segment is a clickable button
   - Clicking calls `onNavigate(index)` to navigate to that level
   - Separated by `›` character

**Navigation Flow:**
```
User clicks breadcrumb at index 1
  ↓
onNavigate(1) called
  ↓
App.handleBreadcrumbNavigate(1)
  ↓
Calculate new path: hoistedPath.slice(0, 2)
  ↓
Traverse jsonData to find data at new path
  ↓
Update hoistedData and hoistedPath
  ↓
Tree re-renders with new hoisted data
```

---

## Data Flow

### Input → Parse → Render Flow

```
1. User types in textarea
   ↓
2. handleInputChange(value)
   ↓
3. JSON.parse(value)
   ├── Success → normalizeKeys(parsed)
   │              ↓
   │           setJsonData(normalized)
   │              ↓
   │           Tree re-renders
   └── Error → setError(message)
                ↓
             Error displayed
```

### Hoist/Focus Flow

```
1. User clicks "Focus" button on node
   ↓
2. JsonTree.handleHoist()
   ↓
3. Calls onHoist(path, data)
   ↓
4. App.handleHoist(path, data)
   ↓
5. setHoistedData(data)
   setHoistedPath(path)
   ↓
6. displayData = hoistedData || jsonData
   ↓
7. JsonTree re-renders with hoisted data
   ↓
8. Breadcrumbs show hoisted path
```

### Breadcrumb Navigation Flow

```
1. User clicks breadcrumb segment
   ↓
2. Breadcrumbs.onNavigate(index)
   ↓
3. App.handleBreadcrumbNavigate(index)
   ↓
4. Calculate new path: hoistedPath.slice(0, index + 1)
   ↓
5. Traverse jsonData using path segments
   ↓
6. Update hoistedData and hoistedPath
   ↓
7. Tree and breadcrumbs re-render
```

---

## Core Features & Implementation

### 1. JSON Parsing & Validation

**Location:** `App.handleInputChange()`

**Implementation:**
- Uses native `JSON.parse()` for parsing
- Wraps in try-catch for error handling
- Real-time validation as user types
- Error state displayed below textarea

**Error Display:**
- Red background gradient
- Error message from `JSON.parse`
- Only shown when error exists

### 2. Key Normalization

**Location:** `App.normalizeKeys()`

**Why Needed:**
- JavaScript allows numeric object keys: `{123: "value"}`
- JSON standard requires string keys
- Ensures consistent path tracking
- Prevents rendering issues

**Recursive Algorithm:**
```typescript
function normalizeKeys(obj):
  if obj is null or not object:
    return obj
  if obj is array:
    return obj.map(normalizeKeys)
  else:
    normalized = {}
    for each [key, value] in obj:
      normalized[String(key)] = normalizeKeys(value)
    return normalized
```

### 3. Recursive Tree Rendering

**Location:** `JsonTree` component (self-referencing)

**Recursion Pattern:**
```typescript
JsonTree(data, level, path)
  ├── If data is object/array:
  │     ├── Render node header
  │     └── If expanded:
  │           └── For each child:
  │                 └── JsonTree(child, level+1, newPath) ← RECURSION
  └── Else:
        └── Render leaf node
```

**Base Cases:**
1. Primitive value (string, number, boolean, null) → Render leaf
2. Empty object/array → Show "empty" indicator
3. `isVisible === false` → Return null

**Recursive Cases:**
- Object with properties → Render each property recursively
- Array with items → Render each item recursively

**Depth Management:**
- `level` parameter tracks depth
- Used for:
  - Indentation calculation
  - Default expand state (shallow = expanded)
  - Tree connector rendering (level > 0)

### 4. Focus Mode (Hoisting)

**Concept:** Isolate a subtree by making it the root.

**Implementation:**
1. **Trigger:** User clicks "Focus" button on any node
2. **Data Capture:** Component passes its `path` and `data` to parent
3. **State Update:** App sets `hoistedData = data`, `hoistedPath = path`
4. **Re-render:** Tree renders `hoistedData` instead of `jsonData`
5. **Breadcrumbs:** Show path from original root to hoisted node

**Benefits:**
- Reduces visual clutter
- Focuses on specific data section
- Easy navigation back via breadcrumbs

**Reset:**
- Click "Root" button in breadcrumbs
- Sets `hoistedData = null`, `hoistedPath = []`
- Tree shows full JSON again

### 5. Breadcrumb Navigation

**Purpose:** Navigate up/down the hoisted path hierarchy.

**Path Representation:**
- Array of strings: `["address", "coordinates"]`
- Array indices: `["[0]", "[1]"]`
- Mixed: `["metadata", "settings", "[0]"]`

**Navigation Logic:**
```typescript
onNavigate(index):
  newPath = hoistedPath.slice(0, index + 1)
  // Example: ["a", "b", "c"], index=1 → ["a", "b"]
  
  currentData = jsonData
  for segment in newPath:
    if segment is array index:
      currentData = currentData[parsedIndex]
    else:
      currentData = currentData[segment]
  
  setHoistedData(currentData)
  setHoistedPath(newPath)
```

### 6. JSON Formatting

**Location:** `App.formatJSON()`

**Process:**
1. Parse JSON (validates syntax)
2. Stringify with `JSON.stringify(data, null, 2)`
   - `null` = no replacer
   - `2` = 2-space indentation
3. Update textarea with formatted string
4. Update tree with parsed data

**User Experience:**
- One-click formatting
- Maintains tree visualization
- Improves readability

### 7. Copy to Clipboard

**Location:** `JsonTree.handleCopy()`

**Implementation:**
- Uses Web Clipboard API: `navigator.clipboard.writeText()`
- For strings: Copy directly
- For objects/arrays: Stringify with formatting
- Button appears on hover (UX optimization)

**Copy Format:**
- Primitive: Raw value
- Complex: Pretty-printed JSON (2-space indent)

---

## UI/UX Features

### 1. Tree Connectors (Visual Hierarchy)

**Purpose:** Visually connect parent nodes to children.

**Implementation (CSS):**

**Vertical Lines:**
```css
.tree-line-vertical {
  position: absolute;
  left: 9px;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed #C4B5FD;  /* Light lavender */
}
```

**Horizontal Connectors:**
```css
.tree-line-horizontal {
  position: absolute;
  left: 9px;
  top: 14px;
  width: 12px;
  height: 1px;
  border-top: 1px dashed #C4B5FD;
}
```

**Tree Dots (Leaf Nodes):**
```css
.tree-dot {
  position: absolute;
  left: 5px;
  top: 11px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C4B5FD;
}
```

**Rendering Logic:**
- Only shown when `level > 0` (not root)
- Vertical line spans from top to bottom of node
- Horizontal line connects to parent
- Last child: Vertical line only goes to node start
- Non-last child: Vertical line continues to next sibling

**CSS Pseudo-elements:**
- `.tree-child::before` → Vertical line
- `.tree-child::after` → Horizontal connector
- `.tree-child.last-child::before` → Shortened vertical line

### 2. Expand/Collapse Animation

**Visual Feedback:**
- Arrow rotates: `▶` → `▼`
- Smooth CSS transition: `transform: rotate(90deg)`
- Children fade in/out (CSS transition)

**State Management:**
- `isExpanded` state in each JsonTree instance
- Independent per node (can have mixed expanded/collapsed)

**Default Behavior:**
- Levels 0-1: Expanded (shows structure immediately)
- Level 2+: Collapsed (prevents overwhelming display)

### 3. Hover Effects

**Key Name Hover:**
```css
.key-name:hover {
  transform: translateY(-2px);  /* Lifts off page */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);  /* Soft shadow */
}
```

**Node Header Hover:**
- Subtle background change
- Slight elevation (translateY)
- Enhanced shadow

**Copy Button:**
- Hidden by default (`opacity: 0`)
- Appears on hover (`opacity: 1`)
- Smooth transition

### 4. Type Badges

**Display:**
- `Array[3]` for arrays with count
- `Object{5}` for objects with property count
- Color-coded (green gradient)
- Uppercase text

**Calculation:**
```typescript
entries.length  // Number of properties/items
```

### 5. Empty State Handling

**Empty Objects/Arrays:**
- Show "empty" indicator
- Disable expand button
- Still render node structure

**No Data:**
- Show friendly message
- Suggest loading sample data
- Different message for errors

### 6. Error Display

**Visual Design:**
- Red gradient background
- Bold error text
- Positioned below textarea
- Only visible when error exists

**Error Source:**
- `JSON.parse()` exception message
- Real-time validation
- Cleared on successful parse

---

## State Management

### State Architecture

**App-Level State:**
```typescript
jsonInput: string        // Source of truth for input
jsonData: any           // Parsed, normalized data
error: string | null    // Validation errors
hoistedData: any        // Focused subtree
hoistedPath: string[]   // Path to focused subtree
```

**Component-Level State:**
```typescript
// JsonTree component
isExpanded: boolean     // Per-node expansion state
```

### State Flow Diagram

```
User Input
  ↓
jsonInput (state)
  ↓
JSON.parse()
  ├── Success → jsonData (state)
  │              ↓
  │           JsonTree renders
  └── Error → error (state)
                ↓
             Error UI shows

User Clicks Focus
  ↓
onHoist(path, data)
  ↓
hoistedData, hoistedPath (state)
  ↓
displayData = hoistedData || jsonData
  ↓
JsonTree re-renders with focused data
```

### State Synchronization

**Input → Tree:**
- `jsonInput` changes → Parse → `jsonData` updates → Tree re-renders

**Hoist → Display:**
- `hoistedData` set → `displayData` calculated → Tree shows subset

**Reset:**
- `hoistedData = null` → `displayData = jsonData` → Full tree shown

---

## Styling Architecture

### CSS Organization

**File Structure:**
```
src/
├── index.css           # Global styles, body, root
├── App.css             # App layout, panels, buttons
└── components/
    ├── JsonTree.css   # Tree nodes, connectors, values
    └── Breadcrumbs.css # Breadcrumb navigation
```

### Design System

**Color Palette:**
- **Strings:** `#87A96B` (Soft Sage Green)
- **Numbers:** `#87CEEB` (Sky Blue)
- **Booleans:** `#FF7F7F` (Coral Pink)
- **Null:** `#6b7280` (Gray)
- **Connectors:** `#C4B5FD` (Light Lavender)
- **Background:** `#F8FAFC` (Off-white)
- **Primary:** `#10b981` (Emerald Green)

**Typography:**
- **UI Elements:** System sans-serif (Inter preferred)
- **JSON Data:** Monospace (JetBrains Mono, Fira Code)

**Spacing:**
- Consistent padding: 24px
- Node spacing: 4px vertical
- Indentation: 20px per level

**Shadows:**
- Soft, multi-layer shadows
- Inset highlights for glass effect
- Hover: Enhanced shadow depth

**Borders:**
- Rounded corners: 24px (cards), 6px (buttons)
- Dashed lines for connectors
- Subtle borders with transparency

### Responsive Design

**Breakpoints:**
```css
@media (max-width: 1024px) {
  /* Stack panels vertically */
  grid-template-columns: 1fr;
}
```

**Adaptive Features:**
- Grid layout switches to single column
- Panels maintain minimum height
- Touch-friendly button sizes

---

## Key Algorithms

### 1. Recursive Tree Traversal

**Algorithm:**
```typescript
function renderTree(data, level, path):
  type = getValueType(data)
  
  if type is 'object' or 'array':
    entries = getEntries(data, type)
    
    renderNodeHeader(data, type, entries.length)
    
    if isExpanded and not empty:
      for each [key, value] in entries:
        childPath = buildPath(path, key, type)
        renderTree(value, level + 1, childPath)  // RECURSION
  else:
    renderLeafNode(data, type)
```

**Time Complexity:** O(n) where n = number of nodes
**Space Complexity:** O(d) where d = maximum depth (call stack)

### 2. Path Building

**Algorithm:**
```typescript
function buildPath(parentPath, key, isArray):
  if isArray:
    return [...parentPath, `[${key}]`]
  else:
    return [...parentPath, key]
```

**Example:**
```
Root: []
  → "address": ["address"]
    → "street": ["address", "street"]
  → "[0]": ["[0]"]
    → "name": ["[0]", "name"]
```

### 3. Path Traversal (Breadcrumb Navigation)

**Algorithm:**
```typescript
function traversePath(data, path):
  current = data
  
  for segment in path:
    if segment is array index:
      index = parseIndex(segment)  // "[0]" → 0
      current = current[index]
    else:
      current = current[segment]
  
  return current
```

**Example:**
```
path = ["address", "coordinates", "lat"]
data = { address: { coordinates: { lat: 40.7128 } } }

Step 1: current = data["address"]
Step 2: current = current["coordinates"]
Step 3: current = current["lat"]
Result: 40.7128
```

### 4. Key Normalization

**Algorithm:**
```typescript
function normalizeKeys(obj):
  // Base case
  if obj is null or not object:
    return obj
  
  // Array case
  if obj is array:
    return obj.map(normalizeKeys)
  
  // Object case
  normalized = {}
  for [key, value] in Object.entries(obj):
    stringKey = String(key)
    normalized[stringKey] = normalizeKeys(value)
  
  return normalized
```

**Example:**
```
Input: { 123: "value", "key": { 456: "nested" } }
Output: { "123": "value", "key": { "456": "nested" } }
```

---

## Performance Considerations

### Optimization Strategies

1. **Conditional Rendering:**
   - `isVisible` prop prevents unnecessary renders
   - Empty nodes don't render children

2. **State Management:**
   - Local state for expansion (per component)
   - Global state only for data and navigation

3. **Memoization Opportunities:**
   - Could memoize `normalizeKeys` result
   - Could memoize path calculations

4. **Rendering:**
   - Only expanded nodes render children
   - Collapsed nodes have minimal DOM

### Scalability

**Current Limits:**
- Handles large JSON structures well
- Deep nesting supported (recursive)
- No artificial depth limits

**Potential Improvements:**
- Virtual scrolling for very large trees
- Lazy loading of deep nodes
- Memoization of expensive calculations

---

## Extension Points

### Adding New Features

1. **Search Functionality:**
   - Add search state to App
   - Filter tree nodes based on search
   - Highlight matching nodes

2. **Export Options:**
   - Add export buttons
   - Support JSON, CSV, etc.
   - Use current `jsonData` state

3. **Theme Switching:**
   - Add theme state
   - CSS variables for colors
   - Toggle between themes

4. **Node Actions:**
   - Edit values
   - Delete nodes
   - Add new nodes
   - Modify `jsonData` and update tree

---

## Testing Considerations

### Unit Test Targets

1. **normalizeKeys():**
   - Test with numeric keys
   - Test with nested objects
   - Test with arrays
   - Test with null/undefined

2. **Path Building:**
   - Test array path building
   - Test object path building
   - Test mixed paths

3. **Path Traversal:**
   - Test simple paths
   - Test nested paths
   - Test array index paths
   - Test error cases (invalid paths)

4. **JSON Parsing:**
   - Test valid JSON
   - Test invalid JSON
   - Test edge cases (empty, null, etc.)

### Integration Test Scenarios

1. **Full Flow:**
   - Input JSON → Parse → Render → Interact

2. **Hoist Flow:**
   - Click Focus → Verify hoist → Navigate breadcrumbs → Reset

3. **Format Flow:**
   - Input unformatted → Click Format → Verify formatting

---

## Conclusion

The JSON Tree Visualizer uses a recursive component architecture to render hierarchical JSON data. Key features include:

- **Recursive Rendering:** Self-referencing JsonTree component
- **State Management:** React hooks for local and global state
- **Navigation:** Breadcrumbs and hoisting for large data
- **User Experience:** Expand/collapse, copy, format, error handling
- **Visual Design:** Tree connectors, color coding, hover effects

The architecture is modular, extensible, and optimized for both small and large JSON structures.
