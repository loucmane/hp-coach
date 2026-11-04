import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Wordmark } from './Wordmark'

export function PhoneBar({ account, onSearch }: { account: ReactNode; onSearch: () => void }) {
  return (
    <header className="fa-ptop">
      <Link className="fa-brand-link" to="/" aria-label="HP-Coach, Idag">
        <Wordmark />
      </Link>
      <div className="fa-phone-actions">
        <button type="button" className="fa-icon-btn" aria-label="Sök" onClick={onSearch}>
          <Search size={22} strokeWidth={1.8} aria-hidden />
        </button>
        {account}
      </div>
    </header>
  )
}
