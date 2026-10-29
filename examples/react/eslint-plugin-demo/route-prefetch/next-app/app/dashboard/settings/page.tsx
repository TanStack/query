// ✅ passes: the dashboard layout's prefetch also covers nested pages
import { Welcome } from '../welcome'

export default function SettingsPage() {
  return (
    <section>
      <Welcome />
      <h2>Settings</h2>
    </section>
  )
}
