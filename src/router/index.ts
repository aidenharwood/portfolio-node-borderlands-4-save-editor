import { createRouter, createWebHistory } from "vue-router";
import { PageComponent } from "./route-helpers";

// Import actual page components (not view wrappers)
import BL4SaveEditor from "@/pages/BL4SaveEditor.vue";

const routes = [
  { path: "/", component: PageComponent({ component: BL4SaveEditor, renderLayout: false }) },
];

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    // always scroll to top
    return { top: 0 };
  },
  routes,
});

export default router;
