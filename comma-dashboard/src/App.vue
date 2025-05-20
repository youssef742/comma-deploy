<template>
  <div class="app-container">
    <!-- Sidebar (conditionally rendered) -->
    <div class="sidebar" v-if="showSidebar">
      <div class="navigation-header">
        <h3
          style="
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
          "
        >
          <Icon icon="mdi:comma-circle" width="24px" height="24px" /> Comma
        </h3>
        <span>Admin Dashboard</span>
        <p>___________________________</p>
      </div>
      <ul>
        <!-- Customers Tab -->
        <li
          v-if="showTab('customers')"
          class="tab"
          :class="{ active: activeTab === 'customers' }"
          @click="navigateTo('customers')"
        >
          <Icon icon="line-md:account" width="24px" height="24px" /> Customers
        </li>
        <!-- <li
          v-if="showTab('Active Customers')"
          class="tab"
          :class="{ active: activeTab === 'Active Customers' }"
          @click="navigateTo('Active Customers')"
        >
          <Icon icon="mdi:account-convert-outline" width="24px" height="24px" />
          Active Customers
        </li> -->

        <!-- Branches Tab -->
        <li
          v-if="showTab('branches')"
          class="tab"
          :class="{ active: activeTab === 'branches' }"
          @click="navigateTo('branches')"
        >
          <Icon icon="fluent:branch-20-filled" width="24px" height="24px" />
          Branches
        </li>

        <!-- Appointments Tab -->
        <li
          v-if="showTab('appointments')"
          class="tab"
          :class="{ active: activeTab === 'appointments' }"
          @click="navigateTo('appointments')"
        >
          <Icon icon="icon-park-solid:appointment" width="24px" height="24px" />
          Appointments
        </li>

        <!-- Rooms Tab -->
        <li
          v-if="showTab('rooms')"
          class="tab"
          :class="{ active: activeTab === 'rooms' }"
          @click="navigateTo('rooms')"
        >
          <Icon icon="cil:room" width="24px" height="24px" /> Rooms
        </li>

        <!-- Employees Tab -->
        <li
          v-if="showTab('employees')"
          class="tab"
          :class="{ active: activeTab === 'employees' }"
          @click="navigateTo('employees')"
        >
          <Icon
            icon="clarity:employee-group-solid"
            width="24px"
            height="24px"
          />
          Employees
        </li>

        <!-- Kitchen Items Tab -->
        <li
          v-if="showTab('kitchen-items')"
          class="tab"
          :class="{ active: activeTab === 'kitchen-items' }"
          @click="navigateTo('kitchen-items')"
        >
          <Icon icon="tabler:tools-kitchen-2" width="24px" height="24px" />
          Kitchen Items
        </li>
        <!-- kitchen sales tab -->
        <li
          v-if="showTab('kitchen-sales')"
          class="tab"
          :class="{ active: activeTab === 'kitchen-sales' }"
          @click="navigateTo('kitchen-sales')"
        >
          <Icon icon="mdi:food-turkey" width="24px" height="24px" />
          Kitchen Sales
        </li>
        <li
          v-if="showTab('Shared-Area')"
          class="tab"
          :class="{ active: activeTab === 'Shared-Area' }"
          @click="navigateTo('Shared-Area')"
        >
          <Icon icon="hugeicons:shared-wifi" width="24px" height="24px" />
          Shared-Area
        </li>
        <!-- Bookings Tab -->
        <li
          v-if="showTab('bookings')"
          class="tab"
          :class="{ active: activeTab === 'bookings' }"
          @click="navigateTo('bookings')"
        >
          <Icon icon="uim:calender" width="24px" height="24px" /> Room Bookings
        </li>

        <!-- Statistics Tab -->
        <li
          v-if="showTab('statistics')"
          class="tab"
          :class="{ active: activeTab === 'statistics' }"
          @click="navigateTo('statistics')"
        >
          <Icon icon="uil:statistics" width="24px" height="24px" /> Statistics
        </li>

        <!-- Packages Tab -->
        <li
          v-if="showTab('packages')"
          class="tab"
          :class="{ active: activeTab === 'packages' }"
          @click="navigateTo('packages')"
        >
          <Icon icon="iconoir:packages" width="24px" height="24px" /> Packages
        </li>
      </ul>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    <!-- Main Content -->
    <div class="content" :class="{ 'full-width': !showSidebar }">
      <router-view />
    </div>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue";

export default {
  components: {
    Icon,
  },
  data() {
    return {
      showSidebar: true, // Default to showing the sidebar
      activeTab: "customers", // Track the active tab
    };
  },
  computed: {
    // Get the user's role from the Vuex store
    role() {
      return this.$store.state.role;
    },
  },
  watch: {
    // Watch for route changes and update `showSidebar` accordingly
    $route(to) {
      this.showSidebar = to.path !== "/login";
      this.updateActiveTab(to.path); // Update active tab based on the route
    },
  },
  created() {
    // Set initial state of `showSidebar` based on the current route
    this.showSidebar = this.$route.path !== "/login";
    this.updateActiveTab(this.$route.path); // Set the initial active tab
  },
  methods: {
    // Check if a tab should be shown based on the user's role
    showTab(tab) {
      if (this.role === "ceo") return true; // CEO can see all tabs
      if (this.role === "branch_manager") {
        // Branch manager can see receptionist tabs + kitchen items + employees
        return [
          "customers",
          "bookings",
          "appointments",
          "rooms",
          "kitchen-items",
          "kitchen-sales",
          "employees",
          "Shared-Area",
        ].includes(tab);
      }
      if (this.role === "receptionist") {
        // Receptionist can only see customers, bookings, appointments, and rooms
        return [
          "customers",
          "bookings",
          "appointments",
          "rooms",
          "Shared-Area",
          "kitchen-sales",
        ].includes(tab);
      }
      return false; // Default to hiding tabs
    },
    // Logout the user
    logout() {
      this.$store.commit("setRole", null); // Clear the role in the Vuex store
      this.$router.push("/login"); // Redirect to the login page
    },
    // Navigate to a specific route
    navigateTo(route) {
      this.$router.push(`/${route}`);
      this.activeTab = route; // Update the active tab
    },
    // Update the active tab based on the current route
    updateActiveTab(path) {
      const route = path.split("/")[1]; // Extract the route name (e.g., 'customers')
      if (route) {
        this.activeTab = route;
      }
    },
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  background-color: #000;
  color: #ffd700;
}

.sidebar {
  width: 250px;
  background-color: #222;
  padding: 20px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin: 15px 0;
  cursor: pointer;
}

.sidebar li:hover,
.sidebar li.active {
  color: black;
  background-color: #e6b800;
  border-radius: 8px;
}

.sidebar button {
  background-color: #ab3f3f;
  border: none;
  padding: 10px;
  width: 100%;
  cursor: pointer;
  border-radius: 8px;
  font-weight: bold;
}

.sidebar button:hover {
  background-color: #e60000;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.full-width {
  margin-left: 0 !important; /* Remove margin when sidebar is hidden */
}

.navigation-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.tab {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px;
}
</style>
