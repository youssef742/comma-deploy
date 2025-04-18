<template>
  <div class="shared-area-container">
    <!-- Header with Buttons -->
    <div class="header">
      <div class="buttons">
        <button class="btn-primary" @click="showCheckInForm = true">
          Check-In
        </button>
        <button class="btn-success" @click="showCheckOutForm = true">
          Check-Out
        </button>
      </div>
      <span class="checkin-count">No. Check-Ins: {{ checkIns.length }}</span>
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

    <!-- Check-Ins Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>Customer ID</th>
          <th>Customer Name</th>
          <th>Check-In Time</th>
          <th>Check-Out Time</th>
          <th>Total Cost</th>
          <th>Total Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="checkIns.length === 0">
          <td colspan="8" style="text-align: center; color: #888">
            No check-ins found.
          </td>
        </tr>
        <tr v-for="checkIn in paginatedCheckIns" :key="checkIn.id">
          <td>{{ checkIn.customer_id }}</td>
          <td>{{ checkIn.customer_name }}</td>
          <td>
            {{ formatDateTime(checkIn.check_in_time) || "Not Checked In" }}
          </td>
          <td>
            {{ formatDateTime(checkIn.check_out_time) || "Not Checked Out" }}
          </td>
          <td>
            {{ checkIn.total_cost ? `${checkIn.total_cost} EGP` : "N/A" }}
          </td>
          <td>
            {{ checkIn.total_time ? `${checkIn.total_time} minutes` : "N/A" }}
          </td>
          <td>{{ checkIn.status }}</td>
          <td>
            <button
              class="btn-delete"
              @click="confirmDeleteCheckIn(checkIn)"
              v-if="checkIn.status === 'active'"
            >
              Cancel Check-In
            </button>
          </td>
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

    <!-- Check-In Form Dialog -->
    <div v-if="showCheckInForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Check-In Customer</h2>
        <form @submit.prevent="handleCheckIn" class="checkin-form">
          <div class="form-group">
            <label for="customerId">Customer ID:</label>
            <input
              v-model="checkInData.customerId"
              id="customerId"
              required
              @input="validateCustomer"
            />
            <p v-if="customerError" class="error-message">
              {{ customerError }}
            </p>
          </div>
          <div class="form-group">
            <label for="type">Shared Area Type:</label>
            <select v-model="checkInData.type" id="type" required>
              <option value="VIP">VIP Area</option>
              <option value="Quiet Area">Quiet Area</option>
              <option value="General Area">General Area</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showCheckInForm = false">
              Cancel
            </button>
            <button type="submit">Check-In</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Check-Out Form Dialog -->
    <div v-if="showCheckOutForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Check-Out Customer</h2>
        <form @submit.prevent="handleCheckOut" class="checkout-form">
          <div class="form-group">
            <label for="checkOutCustomerId">Customer ID:</label>
            <input
              v-model="checkOutData.customerId"
              id="checkOutCustomerId"
              required
            />
          </div>
          <div class="form-group">
            <label for="kitchenItems">Kitchen Items:</label>
            <div class="kitchen-items-container">
              <div
                v-for="item in kitchenItems"
                :key="item.id"
                class="kitchen-item"
              >
                <input
                  type="checkbox"
                  :id="`item-${item.id}`"
                  :value="item.id"
                  v-model="checkOutData.kitchenItems"
                />
                <label :for="`item-${item.id}`"
                  >{{ item.name }} ({{ item.price }} EGP)</label
                >
                <input
                  type="number"
                  min="1"
                  v-model="item.quantity"
                  v-if="checkOutData.kitchenItems.includes(item.id)"
                  class="quantity-input"
                />
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="showCheckOutForm = false">
              Cancel
            </button>
            <button type="submit">Check-Out</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirmation" class="dialog-overlay">
      <div class="dialog">
        <h2>Cancel Check-In</h2>
        <p style="color: black">
          Are you sure you want to cancel this check-in?
        </p>
        <textarea
          v-model="cancellationReason"
          placeholder="Please provide a reason for cancellation"
          style="width: 100%; margin-bottom: 10px"
        ></textarea>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button
            type="button"
            @click="deleteCheckInConfirmed"
            class="btn-delete"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      checkIns: [],
      search: {
        name: "",
        customerId: "",
      },
      showCheckInForm: false,
      showCheckOutForm: false,
      showDeleteConfirmation: false,
      checkInToDelete: null,
      kitchenItems: [],
      checkInData: {
        customerId: "",
        type: "General Area",
      },
      checkOutData: {
        customerId: "",
        kitchenItems: [],
      },
      customerError: "",
      currentPage: 1,
      itemsPerPage: 10,
      cancellationReason: "",
    };
  },
  computed: {
    filteredCheckIns() {
      return this.checkIns.filter((checkIn) => {
        const customerName = checkIn.customer_name || "";
        const searchName = this.search.name || "";
        const customerId = checkIn.customer_id || "";
        const searchCustomerId = this.search.customerId || "";

        return (
          customerName.toLowerCase().includes(searchName.toLowerCase()) &&
          customerId.includes(searchCustomerId)
        );
      });
    },
    paginatedCheckIns() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredCheckIns.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredCheckIns.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.loadKitchenItems();
    await this.loadCheckIns();
  },
  methods: {
    async loadKitchenItems() {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/kitchen-items"
        );
        this.kitchenItems = response.data;
      } catch (error) {
        console.error("Error loading kitchen items:", error);
        toastr.error("Failed to load kitchen items. Please try again.");
      }
    },
    async loadCheckIns() {
      try {
        let url;

        // Check if the path includes '/All', which will match all related paths
        if (this.$route.path.includes("/All")) {
          // ✅ Correct API route to fetch all check-ins
          url = "http://localhost:3000/api/shared-area/shared-area-checkins";
        } else {
          // Get check-ins for a specific type
          const type = this.$route.params.type;
          url = `http://localhost:3000/api/shared-area/shared-area-checkins/${type}`;
        }

        const response = await axios.get(url);
        this.checkIns = response.data;
      } catch (error) {
        console.error("Error loading check-ins:", error);
        toastr.error("Failed to load check-ins. Please try again.");
      }
    },
    async validateCustomer() {
      if (!this.checkInData.customerId) {
        this.customerError = "";
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:3000/api/customers/${this.checkInData.customerId}`
        );
        if (response.data) {
          this.customerError = "";
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.customerError = "Customer does not exist";
        } else {
          console.error("Error validating customer:", error);
          this.customerError = "Error validating customer. Please try again.";
        }
      }
    },
    async handleCheckIn() {
      if (this.customerError) {
        toastr.error("Please fix the errors before submitting.");
        return;
      }

      try {
        const payload = {
          customer_id: this.checkInData.customerId,
          type: this.checkInData.type,
        };
        const response = await axios.post(
          "http://localhost:3000/api/shared-area/check-in",
          payload
        );
        this.checkIns.push(response.data);
        this.showCheckInForm = false;
        this.resetCheckInData();
        this.loadCheckIns();
        //   Swal.fire({
        //     title: "Check-In Successful!",
        //     html: `
        //   <p>Customer: <strong>${response.data.customer_name}</strong></p>
        //   <p>Check-In Time: <strong>${this.formatDateTime(
        //     response.data.check_in_time
        //   )}</strong></p>
        //   <p>Type: <strong>${response.data.type}</strong></p>
        // `,
        //     icon: "success",
        //     confirmButtonText: "OK",
        //   });
        toastr.success("Customer checked-in successfully!");
      } catch (error) {
        console.error("Error checking in:", error);
        toastr.error("Failed to check in. Please try again.");
      }
    },
    async handleCheckOut() {
      try {
        const checkIn = this.checkIns.find(
          (c) =>
            c.customer_id === this.checkOutData.customerId &&
            c.status === "active"
        );

        if (!checkIn) {
          toastr.error("Check-in not found");
          return;
        }

        const kitchenItemsWithQuantities = this.kitchenItems
          .filter((item) => this.checkOutData.kitchenItems.includes(item.id))
          .map((item) => ({
            id: item.id,
            quantity: item.quantity || 1,
          }));

        const payload = {
          kitchen_items: kitchenItemsWithQuantities,
        };

        const response = await axios.put(
          `http://localhost:3000/api/shared-area/check-out/${checkIn.id}`,
          payload
        );

        checkIn.check_out_time = response.data.check_out_time;
        checkIn.total_time = response.data.total_time;
        checkIn.total_cost = response.data.total_cost;

        this.showCheckOutForm = false;
        this.resetCheckOutData();
        this.loadCheckIns();
        Swal.fire({
          title: "Check-Out Successful!",
          html: `
            <p>Customer: <strong>${response.data.customer_name}</strong></p>
            <p>Total Time: <strong>${response.data.total_time} minutes</strong></p>
            <p>Total Cost: <strong>${response.data.total_cost} EGP</strong></p>
          `,
          icon: "success",
          confirmButtonText: "OK",
        });
        toastr.success("Customer checked out successfully!");
      } catch (error) {
        console.error("Error checking out:", error);
        toastr.error("Failed to check out, please try again!");
      }
    },
    resetCheckInData() {
      this.checkInData = {
        customerId: "",
        type: "General Area",
      };
      this.customerError = "";
    },
    resetCheckOutData() {
      this.checkOutData = {
        customerId: "",
        kitchenItems: [],
      };
      this.kitchenItems.forEach((item) => {
        item.quantity = 1;
      });
    },
    confirmDeleteCheckIn(checkIn) {
      this.checkInToDelete = checkIn;
      this.showDeleteConfirmation = true;
    },
    async deleteCheckInConfirmed() {
      if (!this.cancellationReason) {
        toastr.warning("Please provide a reason for cancellation.");
        return;
      }

      try {
        await axios.delete(
          `http://localhost:3000/api/shared-area-checkins/${this.checkInToDelete.id}`,
          {
            data: { reason: this.cancellationReason },
          }
        );

        this.checkIns = this.checkIns.map((c) =>
          c.id === this.checkInToDelete.id
            ? {
                ...c,
                status: "cancelled",
                cancellation_reason: this.cancellationReason,
              }
            : c
        );

        this.showDeleteConfirmation = false;
        this.cancellationReason = "";
        toastr.success("Reservation is cancelled successfully!");
      } catch (error) {
        console.error("Error cancelling check-in:", error);
        toastr.error("Failed to cancel check-in. Please try again.");
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
/* Reuse the same styles as roomBooking.vue */
.shared-area-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkin-count {
  font-size: 1.2rem;
  font-weight: bold;
}

.search-fields {
  display: flex;
  gap: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.search-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex: 1;
  border: 2px solid #ffd700;
  outline: none;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  border-radius: 10px;
  table-layout: fixed;
  overflow-x: auto;
}

.custom-table th,
.custom-table td {
  border: 1px solid #cc9c0d;
  text-align: left;
  padding: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-table td {
  text-align: center;
  background-color: white;
  color: black;
}

.custom-table th {
  background-color: #ffd700;
  font-weight: bold;
  color: black;
  padding: 12px;
}

.custom-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.custom-table tr:hover {
  background-color: #f1f1f1;
}

.btn-primary,
.btn-success,
.btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-success {
  background-color: #ff4d4f;
  color: white;
}

.btn-delete {
  background-color: #ff4d4f;
  color: white;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}

.dialog h2 {
  margin-bottom: 20px;
  color: black;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: black;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background-color: #409eff;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #409eff;
  color: white;
  width: 10%;
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination span {
  font-size: 14px;
  color: black;
}
.kitchen-items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 300px; /* Adjust the height as needed */
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.kitchen-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.quantity-input {
  width: 60px;
  margin-top: 5px;
}
</style>
