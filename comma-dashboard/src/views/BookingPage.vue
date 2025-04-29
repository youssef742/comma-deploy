<template>
  <div class="bookings-container">
    <!-- Header with Buttons -->
    <div class="header">
      <div
        class="buttons"
        style="display: flex; flex-direction: row; gap: 10px"
      >
        <button class="btn-primary" @click="showCheckInForm = true">
          Check-In
        </button>
        <button class="btn-success" @click="showCheckOutForm = true">
          Check-Out
        </button>
      </div>
      <span class="booking-count">No. Bookings: {{ bookings.length }}</span>
    </div>

    <!-- Search Fields -->
    <div class="search-fields">
      <input
        v-model="search.customerId"
        placeholder="Search by Customer ID"
        class="search-input"
        @input="search.customerId = $event.target.value.toUpperCase()"
      />
      <input
        v-model="search.name"
        placeholder="Search by Name"
        class="search-input"
      />
    </div>

    <!-- Bookings Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th style="width: 100px">Booking ID</th>
          <th style="width: 100px">Check-In Time</th>
          <th style="width: 100px">Check-Out Time</th>
          <th style="width: 100px">Total Cost</th>
          <th style="width: 100px">Total Time</th>
          <th style="width: 100px">Room</th>
          <th style="width: 100px">Status</th>
          <th
            style="width: 100px"
            v-if="['ceo', 'branch manager'].includes($store.state.role)"
          >
            cancellation reasons
          </th>
          <th style="width: 100px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="bookings.length === 0">
          <td colspan="8" style="text-align: center; color: #888">
            No check-ins found.
          </td>
        </tr>
        <tr v-for="booking in paginatedBookings" :key="booking.id">
          <td>{{ booking.customer_id }}</td>
          <td>
            <template v-if="booking.check_in_time">
              <span class="date-time-container">
                <span class="time-part"
                  >{{ formatDateTime(booking.check_in_time).timePart }},</span
                >
                <span class="date-part">{{
                  formatDateTime(booking.check_in_time).datePart
                }}</span>
              </span>
            </template>
            <span v-else class="not-checked">Not Checked In</span>
          </td>
          <td>
            <template v-if="booking.check_out_time">
              <span class="date-time-container">
                <span class="time-part"
                  >{{ formatDateTime(booking.check_out_time).timePart }},</span
                >
                <span class="date-part">{{
                  formatDateTime(booking.check_out_time).datePart
                }}</span>
              </span>
            </template>
            <span v-else class="not-checked-out">Not Checked Out</span>
          </td>
          <td>
            {{ booking.total_cost ? `${booking.total_cost} EGP` : "N/A" }}
          </td>
          <td>
            {{ booking.total_time ? formatTime(booking.total_time) : "N/A" }}
          </td>
          <td>{{ booking.room || "N/A" }}</td>
          <td>
            <span :class="['status-tag', booking.status]">
              {{
                booking.status === "checked_out"
                  ? "Checked Out"
                  : booking.status === "cancelled"
                  ? "Cancelled"
                  : "Active"
              }}
            </span>
          </td>
          <td v-if="['ceo', 'branch manager'].includes($store.state.role)">
            {{ booking.cancellation_reason }}
          </td>
          <td>
            <button
              class="btn-checkout"
              @click="initiateCheckOut(booking)"
              v-if="!booking.check_out_time && booking.status !== 'cancelled'"
            >
              Check-Out
            </button>
            <button
              class="btn-delete"
              @click="confirmDeleteBooking(booking)"
              v-if="!booking.check_out_time && booking.status !== 'cancelled'"
            >
              Cancel
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
        <form @submit.prevent="handleCheckIn" class="bookings-form">
          <div class="form-group">
            <label for="customerId">Customer ID:</label>
            <input
              v-model="checkInData.customerId"
              id="customerId"
              required
              @input="formatCustomerId"
              autocomplete="off"
              autocapitalize="characters"
              autocorrect="off"
              spellcheck="false"
            />
            <p v-if="customerError" class="error-message">
              {{ customerError }}
            </p>
          </div>
          <div class="form-group">
            <label for="room">Room:</label>
            <select v-model="checkInData.room" id="room" required>
              <option v-for="room in rooms" :key="room.id" :value="room.name">
                {{ room.name }}
              </option>
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
        <form @submit.prevent="handleCheckOut" class="bookings-form">
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
          <div class="form-group">
            <label for="discountPercentage"
              >Discount Percentage (optional):</label
            >
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              v-model="checkOutData.discountPercentage"
              id="discountPercentage"
              placeholder="0-100%"
            />
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
        <h2>Cancel Booking</h2>
        <p style="color: black">
          Are you sure you want to cancel this booking?
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
            @click="deleteBookingConfirmed"
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
// import { Icon } from "@iconify/vue";
import Swal from "sweetalert2";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

export default {
  data() {
    return {
      bookings: [],
      search: {
        name: "",
        customerId: "",
      },
      showCheckInForm: false,
      showCheckOutForm: false,
      showDeleteConfirmation: false,
      bookingToDelete: null,
      rooms: [],
      kitchenItems: [],
      checkInData: {
        customerId: "",
        room: "Shared Area",
      },
      checkOutData: {
        customerId: "",
        kitchenItems: [],
        discountPercentage: null,
      },
      customerError: "",
      currentPage: 1,
      itemsPerPage: 150,
      cancellationReason: "",
    };
  },
  components: {
    // Icon,
  },
  computed: {
    filteredBookings() {
      return this.bookings.filter((booking) => {
        const customerName = booking.customer_name || "";
        const searchName = this.search.name || "";
        const customerId = booking.customer_id || "";
        const searchCustomerId = this.search.customerId || "";

        return (
          customerName.toLowerCase().includes(searchName.toLowerCase()) &&
          customerId.includes(searchCustomerId)
        );
      });
    },
    paginatedBookings() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredBookings.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.loadRooms();
    await this.loadKitchenItems();
    await this.loadBookings();
  },
  methods: {
    formatCustomerId() {
      // Remove all spaces and convert to uppercase
      this.checkInData.customerId = this.checkInData.customerId
        .replace(/\s+/g, "")
        .toUpperCase();

      // Trigger validation after formatting
      this.validateCustomer();
    },
    initiateCheckOut(booking) {
      // Set the customer ID in checkOutData
      this.checkOutData.customerId = booking.customer_id;

      // Show the check-out form
      this.showCheckOutForm = true;

      // Optional: Scroll to the check-out form if needed
      this.$nextTick(() => {
        const formElement = document.querySelector(".dialog-overlay");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    },
    formatTime(minutes) {
      if (!minutes) return "N/A";

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      if (hours > 0 && mins > 0) {
        return `${hours}h ${mins} mins`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${mins} mins`;
      }
    },
    async loadRooms() {
      try {
        const response = await axios.get("/api/rooms");
        this.rooms = response.data;
      } catch (error) {
        console.error("Error loading rooms:", error);
        toastr.error("Failed to load rooms. Please try again.");
      }
    },
    async loadKitchenItems() {
      try {
        const response = await axios.get("/api/kitchen-items");
        this.kitchenItems = response.data;
      } catch (error) {
        console.error("Error loading kitchen items:", error);
        toastr.error("Failed to load kitchen items. Please try again.");
      }
    },
    async loadBookings() {
      try {
        const response = await axios.get("/api/bookings?sort=-createdAt");
        this.bookings = response.data;
      } catch (error) {
        console.error("Error loading bookings:", error);
        toastr.error("Failed to load bookings. Please try again.");
      }
    },
    async validateCustomer() {
      if (!this.checkInData.customerId) {
        this.customerError = "";
        return;
      }

      try {
        const response = await axios.get(
          `/api/customers/${this.checkInData.customerId}`
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
          room: this.checkInData.room,
        };
        const response = await axios.post("/api/bookings/check-in", payload);
        this.bookings.push(response.data);
        this.showCheckInForm = false;
        this.resetCheckInData();

        this.loadBookings();

        toastr.success("Customer checked-in successfully!");
      } catch (error) {
        console.error("Error checking in:", error);

        // Check if there's a response from the server
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          const message = error.response.data.message;

          // Handle specific server messages
          if (message === "Room is currently occupied") {
            toastr.error("Room is busy right now. Please choose another room.");
          } else if (message === "Customer is already checked in") {
            toastr.warning("This customer is already checked in.");
          } else if (message === "Customer not found") {
            toastr.error("Customer not found. Please check the ID.");
          } else if (message === "Room not found") {
            toastr.error("The selected room does not exist.");
          } else {
            toastr.error(message);
          }
        } else {
          toastr.error("Failed to check in. Please try again.");
        }
      }
    },
    async handleCheckOut() {
      try {
        const activeBooking = this.bookings.find(
          (b) =>
            b.customer_id === this.checkOutData.customerId &&
            b.status === "active"
        );

        if (!activeBooking) {
          toastr.error("No active booking found for this customer");
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
          discount_percentage: this.checkOutData.discountPercentage || null, // Add discount to payload
        };

        const response = await axios.put(
          `/api/bookings/check-out/${activeBooking.id}`,
          payload
        );

        // Update local data
        activeBooking.check_out_time = response.data.check_out_time;
        activeBooking.total_time = response.data.total_time;
        activeBooking.total_cost = response.data.total_cost;
        activeBooking.status = "checked_out";

        // Show success message with discount info if applied
        const hours = Math.floor(response.data.total_time / 60);
        const minutes = response.data.total_time % 60;
        const formattedTime = `${hours}hr ${minutes}min`;
        const discountMessage = this.checkOutData.discountPercentage
          ? `<p>Discount Applied: <strong>${this.checkOutData.discountPercentage}%</strong></p>`
          : "";

        Swal.fire({
          title: "Check-Out Successful!",
          html: `
        <p>Customer: <strong>${response.data.customer_name}</strong></p>
        <p>Total Time: <strong>${formattedTime}</strong></p>
        ${discountMessage}
        <p>Total Cost: <strong>${response.data.total_cost} EGP</strong></p>
      `,
          icon: "success",
          confirmButtonText: "OK",
        });

        this.showCheckOutForm = false;
        this.resetCheckOutData();
        this.loadBookings();
      } catch (error) {
        console.error("Error checking out:", error);
        if (error.response && error.response.status === 404) {
          toastr.error("No active booking found or already checked out");
        } else {
          toastr.error("Failed to check out. Please try again.");
        }
      }
    },
    resetCheckInData() {
      this.checkInData = {
        customerId: "",
        room: "Shared Area",
      };
      this.customerError = "";
    },
    resetCheckOutData() {
      this.checkOutData = {
        customerId: "",
        kitchenItems: [],
        discountPercentage: null,
      };
      this.kitchenItems.forEach((item) => {
        item.quantity = 1;
      });
    },
    confirmDeleteBooking(booking) {
      this.bookingToDelete = booking;
      this.showDeleteConfirmation = true;
    },
    async deleteBookingConfirmed() {
      if (!this.cancellationReason) {
        toastr.warning("Please provide a reason for cancellation.");
        return;
      }

      try {
        const response = await axios.delete(
          `/api/bookings/${this.bookingToDelete.id}`,
          {
            data: { reason: this.cancellationReason },
          }
        );

        // Update the specific booking with all returned data
        this.bookings = this.bookings.map((b) =>
          b.id === this.bookingToDelete.id ? response.data : b
        );

        this.showDeleteConfirmation = false;
        this.cancellationReason = "";
        this.bookingToDelete = null;

        toastr.success("Booking cancelled successfully!");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toastr.error("Failed to cancel booking. Please try again.");
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

      // Format date as "20 Apr"
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const datePart = `${day} ${month}`;

      // Format time as "10:56 AM"
      const timePart = date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return { datePart, timePart };
    },
  },
};
</script>

<style scoped>
/* Reuse the same styles as customersPage.vue */
.bookings-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.booking-count {
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
  text-align: center;
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
.btn-checkout {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  transition: background-color 0.3s;
}

.btn-checkout:hover {
  background-color: #45a049;
}
#customerId {
  text-transform: uppercase;
}
.date-time-container {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.date-part {
  font-size: 0.85em;
  color: #666;
}

.time-part {
  font-size: 1em;
  font-weight: 500;
}

/* Status Styling */
.not-checked {
  color: #888;
  font-style: italic;
}

.not-checked-out {
  color: #ff4444;
  font-weight: 500;
}
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-tag.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-tag.checked_out {
  background-color: #e3f2fd;
  color: #1565c0;
}

.status-tag.cancelled {
  background-color: #ffebee;
  color: #c62828;
}
</style>
