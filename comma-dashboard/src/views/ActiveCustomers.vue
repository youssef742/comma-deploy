<template>
  <div class="active-customers-container">
    <!-- Header with Active Customers Count -->
    <div class="header">
      <span class="active-customers-count"
        >Active Customers: {{ activeCustomers.length }}</span
      >
    </div>

    <!-- Search Fields -->
    <div class="search-fields">
      <input
        v-model="search.name"
        placeholder="Search by Name"
        class="search-input"
      />
      <input
        v-model="search.customerId"
        placeholder="Search by Customer ID"
        class="search-input"
      />
    </div>

    <!-- Active Customers Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th style="width: 100px">Customer ID</th>
          <th style="width: 150px">Customer Name</th>
          <th style="width: 150px">Room</th>
          <th style="width: 150px">Check-In Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="activeCustomers.length === 0">
          <td colspan="4" style="text-align: center; color: #888">
            No active customers found.
          </td>
        </tr>
        <tr
          v-for="customer in paginatedActiveCustomers"
          :key="customer.customer_id"
        >
          <td>{{ customer.customer_id }}</td>
          <td>{{ customer.name }}</td>
          <td>{{ customer.room }}</td>
          <td>{{ formatDateTime(customer.check_in_time) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination Controls -->
    <div class="pagination">
      <button @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
  </div>
</template>
<script>
import axios from "axios";

export default {
  data() {
    return {
      activeCustomers: [],
      search: {
        name: "",
        customerId: "",
      },
      currentPage: 1,
      itemsPerPage: 10,
    };
  },
  computed: {
    filteredActiveCustomers() {
      return this.activeCustomers.filter((customer) => {
        const customerName = customer.name || "";
        const searchName = this.search.name || "";
        const customerId = customer.customer_id || "";
        const searchCustomerId = this.search.customerId || "";

        return (
          customerName.toLowerCase().includes(searchName.toLowerCase()) &&
          customerId.includes(searchCustomerId)
        );
      });
    },
    paginatedActiveCustomers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredActiveCustomers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredActiveCustomers.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.loadActiveCustomers();
  },
  methods: {
    async loadActiveCustomers() {
      try {
        const response = await axios.get(
          "/api/bookings/active-customers"
        );
        this.activeCustomers = response.data;
      } catch (error) {
        console.error("Error loading active customers:", error);
      }
    },
    previousPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    formatDateTime(dateTime) {
      if (!dateTime) return null;
      const date = new Date(dateTime);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    },
  },
};
</script>
<style scoped>
.active-customers-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-fields {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.custom-table th {
  background-color: #f4f4f4;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f4f4f4;
  cursor: not-allowed;
}
</style>
