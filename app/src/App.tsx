import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">HP-Coach</h1>
        <p className="text-muted-foreground max-w-md">
          Foundation in place. Phase 0 scaffold complete.
        </p>
        <Button size="lg">Fortsätt</Button>
      </div>
    </div>
  )
}

export default App
