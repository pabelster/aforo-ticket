import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'

export function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-mark" aria-hidden="true">
        A
      </span>
      AFORO
    </Link>
  )
}

export function PublicHeader() {
  const { session, loading } = useAuth()
  return (
    <header className="topbar container">
      <Brand />
      {!loading && session ? (
        <Link className="btn btn-ghost btn-sm" to="/admin">
          Panel
        </Link>
      ) : (
        <Link className="btn btn-ghost btn-sm" to="/login">
          Staff
        </Link>
      )}
    </header>
  )
}

const links = [
  { to: '/admin', label: 'Inicio', end: true },
  { to: '/admin/events', label: 'Eventos', end: false },
  { to: '/scan', label: 'Escanear', end: true },
]

export function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <Brand />
        <div className="admin-user">
          <span className="who">{user?.email}</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </header>
      <nav className="admin-nav" aria-label="Panel">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
