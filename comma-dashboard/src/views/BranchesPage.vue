<template>
  <div class="branches-container">
    <!-- Header with Add New Button -->
    <div class="header">
      <div class="buttons">
        <button class="btn-primary" @click="showAddBranchForm = true">
          Add New Branch
        </button>
      </div>
      <span class="branch-count">No. Branches: {{ branches.length }}</span>
    </div>

    <!-- Branch Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Location</th>
          <th>Phone Number</th>
          <th>Rooms Count</th>
          <th>Employees Count</th>
          <th>Customers Count</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Display branches if available -->
        <tr v-for="branch in paginatedBranches" :key="branch.id">
          <td>{{ branch.name }}</td>
          <td>
            <a :href="branch.location" target="_blank">
              {{ branch.location }}
            </a>
          </td>
          <td>{{ branch.phone }}</td>
          <td>{{ branch.rooms_count }}</td>
          <!-- Updated field name -->
          <td>{{ branch.employees_count }}</td>
          <!-- Updated field name -->
          <td>{{ branch.customers_count }}</td>
          <!-- Updated field name -->
          <td>
            <button class="btn-edit" @click="editBranch(branch)">Edit</button>
            <button class="btn-delete" @click="confirmDelete(branch)">
              Delete
            </button>
          </td>
        </tr>

        <!-- Display "No results" row if the table is empty -->
        <tr v-if="paginatedBranches.length === 0">
          <td colspan="7" class="no-results">No results found.</td>
        </tr>
      </tbody>
    </table>

    <!-- Add Branch Form Dialog -->
    <div v-if="showAddBranchForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Add New Branch</h2>
        <form @submit.prevent="addBranch" class="branches-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input v-model="newBranch.name" id="name" required />
          </div>
          <div class="form-group">
            <label for="location">Location:</label>
            <input v-model="newBranch.location" id="location" required />
          </div>
          <div class="form-group">
            <label for="phone">Phone Number:</label>
            <input
              v-model="newBranch.phone"
              pattern="\d{11}"
              maxlength="11"
              id="phone"
              title="Phone number must be exactly 11 digits (numbers only)"
              @input="formatPhone"
              required
            />
          </div>
          <div class="form-group">
            <label for="roomsCount">Rooms Count:</label>
            <input
              v-model="newBranch.rooms_count"
              id="roomsCount"
              type="number"
              required
            />
          </div>
          <div class="form-group">
            <label for="employeesCount">Employees Count:</label>
            <input
              v-model="newBranch.employees_count"
              id="employeesCount"
              type="number"
              required
            />
          </div>
          <div class="form-group">
            <label for="customersCount">Customers Count:</label>
            <input
              v-model="newBranch.customers_count"
              id="customersCount"
              type="number"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddBranchForm = false">
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Branch Form Dialog -->
    <div v-if="showEditBranchForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Edit Branch</h2>
        <form @submit.prevent="saveEditedBranch" class="branches-form">
          <div class="form-group">
            <label for="edit-name">Name:</label>
            <input v-model="editBranchData.name" id="edit-name" />
          </div>
          <div class="form-group">
            <label for="edit-location">Location:</label>
            <input v-model="editBranchData.location" id="edit-location" />
          </div>
          <div class="form-group">
            <label for="edit-phone">Phone Number:</label>
            <input
              v-model="editBranchData.phone"
              id="edit-phone"
              pattern="\d{11}"
              maxlength="11"
              title="Phone number must be exactly 11 digits (numbers only)"
              @input="formatEditPhone"
            />
          </div>
          <div class="form-group">
            <label for="edit-roomsCount">Rooms Count:</label>
            <input
              v-model="editBranchData.rooms_count"
              id="edit-roomsCount"
              type="number"
            />
          </div>
          <div class="form-group">
            <label for="edit-employeesCount">Employees Count:</label>
            <input
              v-model="editBranchData.employees_count"
              id="edit-employeesCount"
              type="number"
            />
          </div>
          <div class="form-group">
            <label for="edit-customersCount">Customers Count:</label>
            <input
              v-model="editBranchData.customers_count"
              id="edit-customersCount"
              type="number"
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="showEditBranchForm = false">
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
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this branch?</p>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button
            type="button"
            @click="deleteBranchConfirmed"
            class="btn-delete"
          >
            Delete
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

export default {
  data() {
    return {
      branches: [], // List of branches
      search: {
        name: "",
        location: "",
        phone: "",
      },
      showAddBranchForm: false,
      showEditBranchForm: false,
      showDeleteConfirmation: false,
      branchToDelete: null,
      branchToEdit: null,
      newBranch: {
        id: "",
        name: "",
        location: "",
        phone: "",
        rooms_count: 0,
        employees_count: 0,
        customers_count: 0,
      },
      editBranchData: {
        id: "",
        name: "",
        location: "",
        phone: "",
        rooms_count: 0,
        employees_count: 0,
        customers_count: 0,
      },
      currentPage: 1,
      itemsPerPage: 10,
    };
  },
  computed: {
    // Filter branches based on search fields
    filteredBranches() {
      return this.branches.filter((branch) => {
        return (
          branch.name.toLowerCase().includes(this.search.name.toLowerCase()) &&
          branch.location
            .toLowerCase()
            .includes(this.search.location.toLowerCase()) &&
          branch.phone.includes(this.search.phone)
        );
      });
    },
    // Paginate the filtered branches
    paginatedBranches() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredBranches.slice(start, end);
    },
    // Calculate total number of pages
    totalPages() {
      return Math.ceil(this.filteredBranches.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.fetchBranches();
  },
  methods: {
    validatePhone(phone) {
      return /^\d{11}$/.test(phone);
    },
    formatPhone() {
      // Remove any non-digit characters
      this.newBranch.phone = this.newBranch.phone.replace(/\D/g, "");
      // Limit to 11 characters
      if (this.newBranch.phone.length > 11) {
        this.newBranch.phone = this.newBranch.phone.substring(0, 11);
      }
    },
    formatEditPhone() {
      this.editBranchData.phone = this.editBranchData.phone.replace(/\D/g, "");
      if (this.editBranchData.phone.length > 11) {
        this.editBranchData.phone = this.editBranchData.phone.substring(0, 11);
      }
    },
    // Fetch all branches from the API
    async fetchBranches() {
      try {
        const response = await axios.get("/api/branches");
        this.branches = response.data;
      } catch (error) {
        console.error("Error fetching branches:", error);
        toastr.error("Failed to load branches.");
      }
    },
    // Add a new branch
    async addBranch() {
      if (!this.validatePhone(this.newCustomer.phone)) {
        alert("Phone number must be exactly 11 digits");
        return;
      }
      try {
        const payload = {
          name: this.newBranch.name,
          location: this.newBranch.location,
          phone: this.newBranch.phone,
          rooms_count: this.newBranch.rooms_count, // Updated field name
          employees_count: this.newBranch.employees_count, // Updated field name
          customers_count: this.newBranch.customers_count, // Updated field name
        };

        const response = await axios.post("/api/branches", payload);
        this.branches.push(response.data);
        this.showAddBranchForm = false;
        this.resetNewBranch();
        toastr.success("Branch added successfully.");
      } catch (error) {
        console.error("Error adding branch:", error);
        toastr.error("Failed to add branch, please try again or call support!");
      }
    },
    // Reset the new branch form
    resetNewBranch() {
      this.newBranch = {
        id: "",
        name: "",
        location: "",
        phone: "",
        roomsCount: 0,
        employeesCount: 0,
        customersCount: 0,
      };
    },
    // Edit a branch
    editBranch(branch) {
      this.branchToEdit = branch;
      this.editBranchData = { ...branch };
      this.showEditBranchForm = true;
    },
    // Save edited branch
    async saveEditedBranch() {
      if (!this.validatePhone(this.editBranchData.phone)) {
        alert("Phone number must be exactly 11 digits");
        return;
      }
      try {
        const payload = {
          name: this.editBranchData.name,
          location: this.editBranchData.location,
          phone: this.editBranchData.phone,
          rooms_count: this.editBranchData.rooms_count, // Updated field name
          employees_count: this.editBranchData.employees_count, // Updated field name
          customers_count: this.editBranchData.customers_count, // Updated field name
        };

        const response = await axios.put(
          `/api/branches/${this.editBranchData.id}`,
          payload
        );

        const index = this.branches.findIndex(
          (b) => b.id === this.editBranchData.id
        );
        if (index !== -1) {
          this.branches[index] = response.data;
        }

        this.showEditBranchForm = false;
        toastr.success("Branch updated successfully!");
      } catch (error) {
        console.error("Error updating branch:", error);
        toastr.error("Failed to update branch. Please try again.");
      }
    },
    // Confirm delete
    confirmDelete(branch) {
      this.branchToDelete = branch;
      this.showDeleteConfirmation = true;
    },
    // Delete a branch after confirmation
    async deleteBranchConfirmed() {
      try {
        await axios.delete(`/api/branches/${this.branchToDelete.id}`);

        this.branches = this.branches.filter(
          (b) => b.id !== this.branchToDelete.id
        );
        this.showDeleteConfirmation = false;
        toastr.success("Branch deleted successfully!");
      } catch (error) {
        console.error("Error deleting branch:", error);
        toastr.error("Failed to delete branch, please try again!");
      }
    },
    // Pagination methods
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
  },
};
</script>

<style scoped>
/* Reuse the same styles as the customers page */
.branches-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.branch-count {
  font-size: 1.2rem;
  font-weight: bold;
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
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: black;
}

.form-group input {
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

/* Style for the "No results" row */
.no-results {
  text-align: center;
  font-style: italic;
  color: #888;
  padding: 20px;
}
</style>
