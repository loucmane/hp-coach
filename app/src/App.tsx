import { HomeMobile } from '@/screens/HomeMobile'

// Phase 0a: design-system foundation + first ported screen.
// Mobile artboard placeholder framing — production routing comes later.

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--panel-2)',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg)',
          borderRadius: 36,
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        <HomeMobile coach="taktiker" />
      </div>
    </div>
  )
}

export default App
