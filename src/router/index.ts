import { createRouter, createWebHistory } from "vue-router";
import { PageComponent } from "./route-helpers";

// Import actual page components (not view wrappers)
import BL4SaveEditor from "@/pages/BL4SaveEditor.vue";
import SerialDebug from "@/pages/SerialDebug.vue";
import SerialDebugger from "@/pages/SerialDebugger.vue";
import ItemEditor from "@/pages/ItemEditor.vue";

const routes = [
  { path: "/", component: PageComponent({ component: BL4SaveEditor, renderLayout: false }) },
  { path: "/serialeditor", component: PageComponent({ component: SerialDebug, renderLayout: false }) },
  { path: "/debugger", component: PageComponent({ component: SerialDebugger, renderLayout: false }) },
  { path: "/itemeditor", component: PageComponent({ component: ItemEditor, renderLayout: false }) },
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
