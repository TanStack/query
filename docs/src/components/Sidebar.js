import { useState } from 'react'
import cn from 'classnames'
import { Search } from './Search'
import CarbonAds from './CarbonAds'
export const Sidebar = ({ active, children, fixed }) => {
  const [searching, setSearching] = useState(false)
  return (
    <aside
      className={cn('sidebar bg-white top-24 flex-shrink-0 pr-2', {
        active,
        'pb-0 flex flex-col z-1 sticky': fixed,
        fixed,
        searching,
      })}
    >
      <div className="sidebar-search my-2 lg:hidden">
        <Search />
      </div>
      <div className="sidebar-content overflow-y-auto pb-4">{children}</div>
      <CarbonAds />
      <style jsx>{`
        .sidebar {
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
        }
        .sidebar.fixed {
          width: 300px;
          padding-right: 2.5rem;
          /* Full page - content margin - header size - banner */
          height: calc(100vh - 1.5rem - 64px - 42px);
        }
        .sidebar.fixed.searching > .sidebar-content {
          display: none;
        }
        .sidebar-search {
          position: relative;
          z-index: 1;
        }
        @media screen and (max-width: 1024px) {
          .sidebar,
          .sidebar.fixed {
            display: none;
          }
          .sidebar.active {
            display: block;
          }
        }
      `}</style>
    </aside>
  )
}
