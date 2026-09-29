export function SetupGuide() {
  return (
    <article className="card stack">
      <h2>Conecta Supabase</h2>
      <p className="muted">
        Copia <span className="mono">.env.example</span> a <span className="mono">.env</span> y pega la URL y la
        anon key del proyecto.
      </p>
      <pre className="env">{`VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key`}</pre>
      <p className="faint">
        Luego ejecuta <span className="mono">supabase/migrations/20260929120000_init.sql</span> en el editor SQL y
        registra la cuenta de staff.
      </p>
    </article>
  )
}
