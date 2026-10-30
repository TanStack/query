// ❌ fails: the chart is code-split with next/dynamic, but its reportOptions query is never prefetched
import dynamic from 'next/dynamic'

const ReportChart = dynamic(() =>
  import('./report-chart').then((mod) => mod.ReportChart),
)

export default function ReportsPage() {
  return (
    <main>
      <h1>Reports</h1>
      {/* eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'reportOptions' used by 'useSuspenseQuery' in './report-chart.tsx' isn't prefetched in this page, so it only starts fetching after the component renders. Start it in this page by passing the same query options to 'queryClient.query()'. */}
      <ReportChart />
    </main>
  )
}
