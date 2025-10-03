import { type Component, h } from 'vue'
import Page from '@/layouts/Page.vue'

export interface PageConfig {
  component: Component
  renderLayout?: boolean
  showNavigation?: boolean
  showSidebar?: boolean
  showArgoCDCard?: boolean
}

// Direct Page component creator matching your requested syntax
export function PageComponent(config: PageConfig) {
  return {
    render: () => h(Page, {
      component: config.component,
      renderLayout: config.renderLayout ?? true,
      showNavigation: config.showNavigation ?? true,
      showSidebar: config.showSidebar ?? true,
      showArgoCDCard: config.showArgoCDCard ?? false,
    })
  }
}

// For even more concise syntax, you can also use:
export const createRoute = PageComponent

// Convenience function for full page routes (no layout)
export function createFullPageRoute(component: Component) {
  return PageComponent({
    component,
    renderLayout: false
  })
}

// Convenience function for standard layout routes
export function createLayoutRoute(component: Component, options?: {
  showArgoCDCard?: boolean
  showNavigation?: boolean
  showSidebar?: boolean
}) {
  return PageComponent({
    component,
    renderLayout: true,
    showArgoCDCard: options?.showArgoCDCard ?? false,
    showNavigation: options?.showNavigation ?? true,
    showSidebar: options?.showSidebar ?? true,
  })
}