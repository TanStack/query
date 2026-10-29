// ✅ passes: the page itself has no client queries besides those of the layouts above it.
export default async function DashboardPage() {
  return <h1>Dashboard</h1>
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
