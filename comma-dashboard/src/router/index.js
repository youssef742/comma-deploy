import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import HomePage from "@/views/HomePage.vue";
import CustomersPage from "@/views/CustomersPage.vue";
import BranchesPage from "@/views/BranchesPage.vue";
import RoomsPage from "@/views/RoomsPage.vue";
import BookingPage from "@/views/BookingPage.vue";
import KitchenItemsPage from "@/views/KitchenItemsPage.vue";
import EmployeesPage from "@/views/EmployeesPage.vue";
import SharedArea from "@/views/SharedArea.vue";
import SharedAreaSelection from "@/views/SharedAreaSelection.vue";
// import AppointmenetsPage from "@/views/AppointmenetsPage.vue";
const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: LoginPage },
  { path: "/home", component: HomePage },
  { path: "/customers", component: CustomersPage },
  { path: "/branches", component: BranchesPage },
  { path: "/rooms", component: RoomsPage },
  { path: "/bookings", component: BookingPage },
  { path: "/kitchen-items", component: KitchenItemsPage },
  { path: "/employees", component: EmployeesPage },
  {
    path: "/shared-area-table/:type?",
    name: "SharedArea",
    component: SharedArea,
    props: (route) => ({ type: route.params.type }), // Pass the `type` route parameter as a prop
  },
  {
    path: "/shared-area",
    name: "SharedAreaSelection",
    component: SharedAreaSelection,
  },
  // { path: "appointments", component: AppointmenetsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
