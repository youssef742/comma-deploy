<template>
  <div class="kitchen-sales-container">
    <!-- Header -->
    <div class="header">
      <h2>Kitchen Sales</h2>
      <button class="btn-primary" @click="showCreateOrderForm = true">
        Create New Order
      </button>
    </div>

    <!-- Search Fields -->
    <div class="search-fields">
      <input
        v-model="search.room_name"
        placeholder="Search by Room Name"
        class="search-input"
        type="text"
      />
      <input
        v-model="search.customer_id"
        placeholder="Search by Customer ID"
        class="search-input"
        type="number"
      />
    </div>

    <!-- Simplified Sales Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Kitchen Items</th>
          <th>Total Price</th>
          <th>Room Name</th>
          <th>Customer ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredSales.length === 0">
          <td colspan="5" style="text-align: center; color: #888">
            No sales records found.
          </td>
        </tr>
        <tr v-for="sale in paginatedSales" :key="sale.order_id">
          <td>{{ sale.order_id }}</td>
          <td>{{ sale.kitchen_items }}</td>
          <td>{{ sale.total_price }} EGP</td>
          <td>{{ sale.room_name }}</td>
          <td>{{ sale.customer_id }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination">
      <button @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>

    <!-- Create Order Dialog (unchanged) -->
    <div v-if="showCreateOrderForm" class="dialog-overlay">
      <!-- Create Order Dialog -->
      <div v-if="showCreateOrderForm" class="dialog-overlay">
        <div class="dialog">
          <h2>Create New Order</h2>
          <form @submit.prevent="createOrder" class="order-form">
            <div class="form-group">
              <label>Room:</label>
              <select
                v-model="newOrder.room_name"
                @change="getRoomCustomer"
                required
              >
                <option value="">Select a Room</option>
                <option v-for="room in rooms" :key="room.id" :value="room.name">
                  {{ room.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Customer ID:</label>
              <input
                v-model="newOrder.customer_id"
                type="text"
                required
                readonly
              />
              <span
                v-if="newOrder.customer_name"
                class="customer-name"
                style="color: black"
              >
                {{ newOrder.customer_name }}
              </span>
            </div>

            <div class="form-group">
              <label>Select Items:</label>
              <div class="item-selection">
                <div
                  v-for="(item, index) in newOrder.items"
                  :key="index"
                  class="item-row"
                >
                  <select
                    v-model="item.id"
                    required
                    @change="calculateItemTotal(index)"
                  >
                    <option value="">Select Item</option>
                    <option
                      v-for="kitchenItem in kitchenItems"
                      :value="kitchenItem.id"
                      :key="kitchenItem.id"
                    >
                      {{ kitchenItem.name }} ({{ kitchenItem.price }} EGP)
                    </option>
                  </select>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    required
                    @input="calculateItemTotal(index)"
                  />
                  <span>{{ item.total_price }} EGP</span>
                  <button
                    type="button"
                    @click="removeItem(index)"
                    class="btn-delete"
                  >
                    ×
                  </button>
                </div>
                <button type="button" @click="addItem" class="btn-add-item">
                  + Add Item
                </button>
              </div>
            </div>

            <div class="form-group total-section">
              <label>Order Total:</label>
              <span class="total-price">{{ orderTotal }} EGP</span>
            </div>

            <div class="form-actions">
              <button type="button" @click="showCreateOrderForm = false">
                Cancel
              </button>
              <button type="submit">Create Order</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

export default {
  data() {
    return {
      kitchenSales: [],
      kitchenItems: [],
      rooms: [],
      activeBookings: [],
      search: {
        room_name: "",
        customer_id: "",
      },
      showCreateOrderForm: false,
      newOrder: {
        room_id: "",
        room_name: "",
        customer_id: "",
        customer_name: "",
        items: [{ id: "", quantity: 1, total_price: 0 }],
      },
      currentPage: 1,
      itemsPerPage: 100,
    };
  },
  computed: {
    filteredSales() {
      return this.kitchenSales.filter((sale) => {
        const roomMatch = this.search.room_name
          ? sale.room_name &&
            sale.room_name
              .toLowerCase()
              .includes(this.search.room_name.toLowerCase())
          : true;

        const customerMatch = this.search.customer_id
          ? sale.customer_id &&
            sale.customer_id.toString().includes(this.search.customer_id)
          : true;

        return roomMatch && customerMatch;
      });
    },
    paginatedSales() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredSales.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredSales.length / this.itemsPerPage);
    },
    orderTotal() {
      return this.newOrder.items.reduce((total, item) => {
        return total + (item.total_price || 0);
      }, 0);
    },
  },
  async created() {
    await this.fetchKitchenSales();
    await this.fetchKitchenItems();
    await this.fetchRooms();
  },
  methods: {
    async fetchKitchenSales() {
      try {
        const response = await axios.get("/api/kitchen-sales");
        this.kitchenSales = response.data;
      } catch (error) {
        console.error("Error fetching kitchen sales:", error);
        toastr.error("Failed to load kitchen sales.");
      }
    },
    async fetchKitchenItems() {
      try {
        const response = await axios.get("/api/kitchen-items");
        this.kitchenItems = response.data;
      } catch (error) {
        console.error("Error fetching kitchen items:", error);
        toastr.error("Failed to load kitchen items.");
      }
    },
    async fetchRooms() {
      try {
        const response = await axios.get("/api/rooms");
        this.rooms = response.data;
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toastr.error("Failed to load rooms data.");
      }
    },
    async getRoomCustomer() {
      if (!this.newOrder.room_name) {
        this.newOrder.customer_id = "";
        this.newOrder.customer_name = "";
        return;
      }

      try {
        const bookingResponse = await axios.get(
          `/api/bookings/active-by-room/${this.newOrder.room_name}`
        );
        const booking = bookingResponse.data;

        if (booking) {
          this.newOrder.customer_id = booking.customer_id.toString(); // Ensure string type

          const room = this.rooms.find(
            (r) => r.name === this.newOrder.room_name
          );
          this.newOrder.room_id = room ? room.id : "";

          if (booking.customer_id) {
            const customerResponse = await axios.get(
              `/api/customers/${booking.customer_id}`
            );
            this.newOrder.customer_name = customerResponse.data.name;
          }
        } else {
          this.newOrder.customer_id = "";
          this.newOrder.customer_name = "No active booking";
        }
      } catch (error) {
        console.error("Error fetching booking info:", error);
        this.newOrder.customer_id = "";
        this.newOrder.customer_name = "Error fetching customer";
      }
    },
    addItem() {
      this.newOrder.items.push({ id: "", quantity: 1, total_price: 0 });
    },
    removeItem(index) {
      if (this.newOrder.items.length > 1) {
        this.newOrder.items.splice(index, 1);
      }
    },
    calculateItemTotal(index) {
      const item = this.newOrder.items[index];
      const selectedItem = this.kitchenItems.find((i) => i.id === item.id);

      if (selectedItem) {
        item.total_price = selectedItem.price * item.quantity;
      } else {
        item.total_price = 0;
      }
    },
    async createOrder() {
      try {
        const orderData = {
          room_id: this.newOrder.room_id,
          customer_id: this.newOrder.customer_id,
          items: this.newOrder.items
            .filter((item) => item.id)
            .map((item) => ({
              item_id: item.id,
              quantity: item.quantity,
            })),
        };

        if (orderData.items.length === 0) {
          toastr.error("Please add at least one item to the order");
          return;
        }

        // Remove the const response = since we're not using it
        await axios.post("/api/kitchen-sales", orderData);

        await this.fetchKitchenSales();
        this.showCreateOrderForm = false;
        this.resetOrderForm();
        toastr.success("Order created successfully!");
      } catch (error) {
        console.error("Error creating order:", error);
        if (error.response && error.response.data.error) {
          toastr.error(`Failed to create order: ${error.response.data.error}`);
        } else {
          toastr.error("Failed to create order. Please try again.");
        }
      }
    },
    resetOrderForm() {
      this.newOrder = {
        room_name: "",
        room_id: "",
        customer_id: "",
        customer_name: "",
        items: [{ id: "", quantity: 1, total_price: 0 }],
      };
    },
    previousPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
  },
};
</script>
<style scoped>
.kitchen-sales-container {
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
  flex: 1;
  border: 2px solid #ffd700;
  outline: none;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.custom-table th,
.custom-table td {
  border: 1px solid #cc9c0d;
  padding: 8px;
  text-align: center;
  background-color: white;
}

.custom-table th {
  background-color: #ffd700;
  font-weight: bold;
  color: black;
}

.custom-table td {
  color: black;
}

.btn-primary {
  padding: 8px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination span {
  font-size: 14px;
  color: black;
}

/* Dialog styles remain the same */
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
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog h2 {
  margin-bottom: 20px;
  color: black;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: black;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.item-selection {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-row select {
  flex: 2;
}

.item-row input {
  flex: 1;
}

.item-row span {
  flex: 1;
  text-align: right;
  color: black;
}

.btn-add-item {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-delete {
  background-color: #ff4d4f;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 20px;
}

.total-price {
  font-weight: bold;
  font-size: 1.2em;
  color: black;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination span {
  font-size: 14px;
  color: black;
}
</style>
