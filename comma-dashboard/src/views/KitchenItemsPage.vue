<template>
  <div class="kitchen-items-container">
    <!-- Header with Buttons -->
    <div class="header">
      <div
        class="buttons"
        style="display: flex; flex-direction: row; gap: 10px"
      >
        <button class="btn-primary" @click="showAddItemForm = true">
          Add New Item
        </button>
        <button
          class="btn-success"
          @click="showExcelImportDialog = true"
          style="background-color: #ffd700; color: black"
        >
          Add Bulk Items
        </button>
      </div>
      <span class="item-count">No. Items: {{ kitchenItems.length }}</span>
    </div>

    <!-- Search Fields -->
    <div class="search-fields">
      <input
        v-model="search.name"
        placeholder="Search by Name"
        class="search-input"
      />
      <input
        v-model="search.category"
        placeholder="Search by Category"
        class="search-input"
      />
    </div>

    <!-- Kitchen Items Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>Item ID</th>
          <th>Item Name</th>
          <th>Price</th>
          <th>Category</th>
          <th>Availability</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="kitchenItems.length === 0">
          <td colspan="6" style="text-align: center; color: #888">
            No items found.
          </td>
        </tr>
        <tr v-for="item in paginatedItems" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.price }} EGP</td>
          <td>{{ item.category }}</td>
          <td>
            <span
              :class="[
                'availability-tag',
                item.availability === 'Available' ? 'success' : 'danger',
              ]"
            >
              {{ item.availability }}
            </span>
          </td>
          <td>
            <button class="btn-edit" @click="editItem(item)">Edit</button>
            <button class="btn-delete" @click="confirmDeleteItem(item)">
              Delete
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

    <!-- Add Item Form Dialog -->
    <div v-if="showAddItemForm" class="dialog-overlay">
      <div class="dialog">
        <h2>
          <Icon icon="mdi:food" width="30px" height="30px" /> Add New Item
        </h2>
        <form @submit.prevent="addItem" class="items-form">
          <div class="form-group">
            <label for="name"
              ><Icon icon="mdi:label" width="24px" height="24px" /> Item
              Name:</label
            >
            <input v-model="newItem.name" id="name" required />
          </div>
          <div class="form-group">
            <label for="price"
              ><Icon icon="mdi:cash" width="24px" height="24px" /> Price:</label
            >
            <input
              v-model="newItem.price"
              id="price"
              type="number"
              step="0.01"
              required
            />
          </div>
          <div class="form-group">
            <label for="category"
              ><Icon icon="mdi:tag" width="24px" height="24px" />
              Category:</label
            >
            <select v-model="newItem.category" id="category" required>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Meals">Meals</option>
              <option value="Desserts">Desserts</option>
            </select>
          </div>
          <div class="form-group">
            <label for="availability"
              ><Icon icon="mdi:check-circle" width="24px" height="24px" />
              Availability:</label
            >
            <select v-model="newItem.availability" id="availability" required>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddItemForm = false">
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Item Form Dialog -->
    <div v-if="showEditItemForm" class="dialog-overlay">
      <div class="dialog">
        <h2><Icon icon="mdi:pencil" width="30px" height="30px" /> Edit Item</h2>
        <form @submit.prevent="saveEditedItem" class="items-form">
          <div class="form-group">
            <label for="edit-name"
              ><Icon icon="mdi:label" width="24px" height="24px" /> Item
              Name:</label
            >
            <input v-model="editItemData.name" id="edit-name" required />
          </div>
          <div class="form-group">
            <label for="edit-price"
              ><Icon icon="mdi:cash" width="24px" height="24px" /> Price:</label
            >
            <input
              v-model="editItemData.price"
              id="edit-price"
              type="number"
              step="0.01"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-category"
              ><Icon icon="mdi:tag" width="24px" height="24px" />
              Category:</label
            >
            <select v-model="editItemData.category" id="edit-category" required>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Meals">Meals</option>
              <option value="Desserts">Desserts</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-availability"
              ><Icon icon="mdi:check-circle" width="24px" height="24px" />
              Availability:</label
            >
            <select
              v-model="editItemData.availability"
              id="edit-availability"
              required
            >
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showEditItemForm = false">
              Cancel
            </button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirmation" class="dialog-overlay">
      <div class="dialog">
        <h2>
          <Icon icon="mdi:delete" width="26px" height="26px" /> Confirm Delete
        </h2>
        <p style="color: black">Are you sure you want to delete this item?</p>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button type="button" @click="deleteItemConfirmed" class="btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Excel Import Dialog -->
    <div v-if="showExcelImportDialog" class="dialog-overlay">
      <div class="dialog">
        <h2>Import Items from Excel</h2>
        <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
        <div class="form-actions">
          <button type="button" @click="showExcelImportDialog = false">
            Cancel
          </button>
          <button type="button" @click="processExcelFile" class="btn-success">
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Icon } from "@iconify/vue";
// import * as XLSX from "xlsx";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

export default {
  data() {
    return {
      kitchenItems: [], // List of kitchen items
      search: {
        name: "",
        category: "",
      },
      showAddItemForm: false,
      showEditItemForm: false,
      showDeleteConfirmation: false,
      showExcelImportDialog: false,
      itemToDelete: null,
      itemToEdit: null,
      excelFile: null,
      newItem: {
        id: "",
        name: "",
        price: 0,
        category: "Beverages",
        availability: "Available",
      },
      editItemData: {
        id: "",
        name: "",
        price: 0,
        category: "Beverages",
        availability: "Available",
      },
      currentPage: 1,
      itemsPerPage: 10,
    };
  },
  components: {
    Icon,
  },
  computed: {
    // Filter items based on search fields
    filteredItems() {
      return this.kitchenItems.filter((item) => {
        const nameMatch = item.name
          .toLowerCase()
          .includes(this.search.name.toLowerCase());
        const categoryMatch = item.category
          .toLowerCase()
          .includes(this.search.category.toLowerCase());

        console.log(
          "Item:",
          item.name,
          "Search Name:",
          this.search.name,
          "Name Match:",
          nameMatch
        );
        console.log(
          "Item Category:",
          item.category,
          "Search Category:",
          this.search.category,
          "Category Match:",
          categoryMatch
        );

        return nameMatch && categoryMatch;
      });
    },
    // Paginate items
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredItems.slice(start, end);
    },
    // Calculate total number of pages
    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.fetchKitchenItems();
  },
  methods: {
    // Fetch all kitchen items from the API
    async fetchKitchenItems() {
      try {
        const response = await axios.get("/api/kitchen-items");
        this.kitchenItems = response.data;
      } catch (error) {
        console.error("Error fetching kitchen items:", error);
        toastr.error("Failed to load kitchen items please call support.");
      }
    },
    // Add a new kitchen item
    async addItem() {
      try {
        const payload = {
          name: this.newItem.name,
          price: this.newItem.price,
          category: this.newItem.category,
          availability: this.newItem.availability,
        };

        const response = await axios.post("/api/kitchen-items", payload);
        this.kitchenItems.push(response.data);
        this.showAddItemForm = false;
        this.resetNewItem();
        toastr.success("Item was added successfully!");
      } catch (error) {
        console.error("Error adding item:", error);
        toastr.error("Failed to add item. Please try again!");
      }
    },
    // Reset the new item form
    resetNewItem() {
      this.newItem = {
        id: "",
        name: "",
        price: 0,
        category: "Beverages",
        availability: "Available",
      };
    },
    // Edit a kitchen item
    editItem(item) {
      this.itemToEdit = item;
      this.editItemData = { ...item };
      this.showEditItemForm = true;
    },
    // Save edited kitchen item
    async saveEditedItem() {
      try {
        const payload = {
          name: this.editItemData.name,
          price: this.editItemData.price,
          category: this.editItemData.category,
          availability: this.editItemData.availability,
        };

        const response = await axios.put(
          `/api/kitchen-items/${this.editItemData.id}`,
          payload
        );

        const index = this.kitchenItems.findIndex(
          (i) => i.id === this.editItemData.id
        );
        if (index !== -1) {
          this.kitchenItems[index] = response.data;
        }

        this.showEditItemForm = false;
        toastr.success("Item was added successfully!");
      } catch (error) {
        console.error("Error updating item:", error);
        toastr.error("Failed to update item. Please try again!");
      }
    },
    // Confirm delete
    confirmDeleteItem(item) {
      this.itemToDelete = item;
      this.showDeleteConfirmation = true;
    },
    // Delete kitchen item after confirmation
    async deleteItemConfirmed() {
      try {
        await axios.delete(`/api/kitchen-items/${this.itemToDelete.id}`);

        this.kitchenItems = this.kitchenItems.filter(
          (i) => i.id !== this.itemToDelete.id
        );
        this.showDeleteConfirmation = false;
        toastr.success("Item was deleted successfully!");
      } catch (error) {
        console.error("Error deleting item:", error);
        toastr.error("Failed to delete item, Please try again!");
      }
    },
    // Handle Excel import button click
    handleFileUpload(event) {
      this.excelFile = event.target.files[0];
    },
    // Process Excel file
    async processExcelFile() {
      if (!this.excelFile) {
        toastr.error("Please select a file.");
        return;
      }

      const formData = new FormData();
      formData.append("file", this.excelFile);

      try {
        const response = await axios.post(
          "/api/kitchen-items/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Add imported items to the list
        this.kitchenItems = [...this.kitchenItems, ...response.data.items];
        this.showExcelImportDialog = false;

        toastr.success(
          `Successfully imported ${response.data.totalAdded} items.`
        );
      } catch (error) {
        console.error("Error uploading file:", error);
        toastr.error(
          "Failed to import items. Please check the file and try again."
        );
      }
    },
    // Pagination methods
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
/* Reuse the same styles as customersPage.vue */
.kitchen-items-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.item-count {
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
}

.custom-table th,
.custom-table td {
  border: 1px solid #cc9c0d;
  text-align: left;
}

.custom-table td {
  text-align: center;
  background-color: white;
  color: black;
  padding: 8px;
  white-space: nowrap;
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

.availability-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.availability-tag.success {
  background-color: #52c41a;
  color: white;
}

.availability-tag.danger {
  background-color: #ff4d4f;
  color: white;
}

.btn-primary,
.btn-success,
.btn-edit,
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
  background-color: #67c23a;
  color: white;
}

.btn-edit {
  background-color: #409eff;
  color: white;
  margin-right: 5px;
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
</style>
