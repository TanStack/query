import { removeFromLast } from './utils';
// @ts-ignore
export function findRouteByPath(path, routes) {
  // eslint-disable-next-line
  for (const route of routes) {
    if (route.path && removeFromLast(route.path, '.') === path) {
      return route;
    }

    const childPath = route.routes && findRouteByPath(path, route.routes);
    if (childPath) return childPath;
  }
}