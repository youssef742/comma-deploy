<template>
  <div class="customers-container">
    <!-- Header with Buttons -->
    <div class="header">
      <div class="buttons">
        <button class="btn-primary" @click="showAddCustomerForm = true">
          Add New Customer
        </button>
        <button
          class="btn-success"
          @click="handleImportExcel"
          style="background-color: #ffd700; color: black"
        >
          Add Group of Customers
        </button>
      </div>
      <span class="customer-count">No. Customers: {{ customers.length }}</span>
    </div>

    <!-- Search Fields -->
    <div class="search-fields">
      <input
        v-model="search.name"
        placeholder="Search by Name"
        class="search-input"
      />
      <input
        v-model="search.id"
        placeholder="Search by ID"
        class="search-input"
      />
      <input
        v-model="search.phone"
        placeholder="Search by Phone"
        class="search-input"
      />
      <input
        v-model="search.nationalId"
        placeholder="Search by National ID"
        class="search-input"
      />
    </div>

    <!-- Customer Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Phone Number</th>
          <th>National ID</th>
          <th>Email</th>
          <th>No. Warnings</th>
          <th>Blacklisted</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in paginatedCustomers" :key="customer.id">
          <td>{{ customer.id }}</td>

          <td>{{ customer.name }}</td>
          <td>{{ customer.phone }}</td>
          <td>{{ customer.nationalId }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ customer.warnings }}</td>
          <td>
            <span
              :class="[
                'blacklist-tag',
                customer.warnings >= 3 ? 'danger' : 'success',
              ]"
            >
              {{ customer.blacklisted }}
            </span>
          </td>
          <td>
            <button class="btn-edit" @click="editCustomer(customer)">
              Edit
            </button>
            <button
              class="btn-delete"
              @click="confirmDelete(customer)"
              v-if="['ceo', 'branch manager'].includes($store.state.role)"
            >
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

    <!-- Add Customer Form Dialog -->
    <div v-if="showAddCustomerForm" class="dialog-overlay">
      <div class="dialog">
        <h2>
          <Icon
            icon="solar:user-plus-bold-duotone"
            width="30px"
            height="30px"
          />
          Add New Customer
        </h2>
        <form @submit.prevent="addCustomer" class="customers-form">
          <div class="form-group">
            <label for="name">
              <Icon
                icon="icon-park-solid:edit-name"
                width="24px"
                height="24px"
              />
              Name:
            </label>
            <input v-model="newCustomer.name" id="name" required />
          </div>
          <div class="form-group">
            <label for="email">
              <Icon
                icon="material-symbols:mail-outline"
                width="24px"
                height="24px"
              />
              Email:
            </label>
            <input
              v-model="newCustomer.email"
              id="email"
              type="email"
              required
              @blur="validateEmailOnBlur"
            />
          </div>
          <div class="form-group">
            <label for="phone">
              <Icon icon="mingcute:phone-line" width="24px" height="24px" />
              Phone:
            </label>
            <input
              v-model="newCustomer.phone"
              id="phone"
              pattern="\d{11}"
              maxlength="11"
              required
              title="Phone number must be exactly 11 digits (numbers only)"
              @input="formatPhone"
            />
          </div>
          <div class="form-group">
            <label for="nationalId">
              <Icon icon="teenyicons:id-solid" width="24px" height="24px" />
              National ID:
            </label>
            <input
              v-model="newCustomer.nationalId"
              id="nationalId"
              pattern="\d{14}"
              maxlength="14"
              required
              title="National ID must be exactly 14 digits (numbers only)"
              @input="formatNationalId"
            />
          </div>
          <div class="form-group">
            <label for="branch">
              <Icon icon="mdi:office-building" width="24px" height="24px" />
              Branch:
            </label>
            <select v-model="selectedBranch" id="branch" required>
              <option
                v-for="branch in branches"
                :key="branch.id"
                :value="branch.id"
              >
                {{ branch.name }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="newCustomer.autoCheckIn">
            <label for="reservation">
              <Icon icon="mdi:reservation" width="24px" height="24px" />
              Reservation:
            </label>
            <select v-model="newCustomer.reservation" id="reservation" required>
              <option value="Shared Area">Shared Area</option>
              <option value="Private Room">Private Room</option>
            </select>
          </div>

          <!-- Shared Area Type Dropdown (Conditional) -->
          <div
            class="form-group"
            v-if="
              newCustomer.reservation === 'Shared Area' &&
              newCustomer.autoCheckIn
            "
          >
            <label for="sharedAreaType">Shared Area Type:</label>
            <select
              v-model="newCustomer.sharedAreaType"
              id="sharedAreaType"
              required
            >
              <option value="VIP">VIP Area</option>
              <option value="Quiet Area">Quiet Area</option>
              <option value="General Area">General Area</option>
            </select>
          </div>

          <!-- Room Selection Dropdown (Conditional) -->
          <div
            class="form-group"
            v-if="
              newCustomer.reservation === 'Private Room' &&
              newCustomer.autoCheckIn
            "
          >
            <label for="room">Room:</label>
            <select v-model="newCustomer.room" id="room" required>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.name }}
              </option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 20px">
            <label class="checkbox-container">
              <input
                type="checkbox"
                v-model="newCustomer.autoCheckIn"
                checked
                class="checkbox-input"
              />
              <span class="checkmark"></span>
              <span class="checkbox-label"
                >Check in this customer immediately</span
              >
            </label>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddCustomerForm = false">
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Customer Form Dialog -->
    <div v-if="showEditCustomerForm" class="dialog-overlay">
      <div class="dialog">
        <h2>
          <Icon icon="material-symbols:edit" width="30px" height="30px" /> Edit
          Customer
        </h2>
        <form @submit.prevent="saveEditedCustomer" class="customers-form">
          <div class="form-group">
            <label for="edit-name">
              <Icon
                icon="icon-park-solid:edit-name"
                width="24px"
                height="24px"
              />
              Name:
            </label>
            <input v-model="editCustomerData.name" id="edit-name" required />
          </div>
          <div class="form-group">
            <label for="edit-email">
              <Icon
                icon="material-symbols:mail-outline"
                width="24px"
                height="24px"
              />
              Email:
            </label>
            <input
              v-model="editCustomerData.email"
              id="edit-email"
              type="email"
              required
              @blur="validateEditEmailOnBlur"
            />
          </div>
          <div class="form-group">
            <label for="edit-phone">
              <Icon icon="mingcute:phone-line" width="24px" height="24px" />
              Phone:
            </label>
            <input
              v-model="editCustomerData.phone"
              id="edit-phone"
              pattern="\d{11}"
              maxlength="11"
              required
              title="Phone number must be exactly 11 digits (numbers only)"
              @input="formatEditPhone"
            />
          </div>
          <div class="form-group">
            <label for="edit-nationalId">
              <Icon icon="teenyicons:id-solid" width="24px" height="24px" />
              National ID:
            </label>
            <input
              v-model="editCustomerData.nationalId"
              id="edit-nationalId"
              pattern="\d{14}"
              maxlength="14"
              required
              title="National ID must be exactly 14 digits (numbers only)"
              @input="formatEditNationalId"
            />
          </div>
          <div class="form-group">
            <label for="edit-warnings">
              <Icon
                icon="material-symbols:warning"
                width="24px"
                height="24px"
              />
              No. Warnings:
            </label>
            <input
              v-model="editCustomerData.warnings"
              id="edit-warnings"
              type="number"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="showEditCustomerForm = false">
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
          <Icon icon="uiw:user-delete" width="26px" height="26px" /> Confirm
          Delete
        </h2>
        <p style="color: black">
          Are you sure you want to delete this customer?
        </p>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button
            type="button"
            @click="deleteCustomerConfirmed"
            class="btn-delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Excel Import Dialog -->
    <div v-if="showExcelImportDialog" class="dialog-overlay">
      <div class="dialog">
        <h2>Import Customers from Excel</h2>
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
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import Swal from "sweetalert2";

// import * as XLSX from "xlsx"; // For Excel file processing

export default {
  data() {
    return {
      rooms: [],
      customers: [], // List of customers fetched from the API
      search: {
        id: "",
        phone: "",
        nationalId: "",
        name: "",
      },
      showAddCustomerForm: false,
      showEditCustomerForm: false, // Controls the edit dialog visibility
      showDeleteConfirmation: false,
      showExcelImportDialog: false,
      customerToDelete: null,
      customerToEdit: null, // Stores the customer being edited
      excelFile: null,
      newCustomer: {
        id: "",
        name: "",
        email: "",
        phone: "",
        nationalId: "",
        warnings: 0,
        isActive: 1,
        reservation: "Shared Area", // Add this field
        sharedAreaType: "VIP", // Add this field
        room: "",
        autoCheckIn: true,
      },
      editCustomerData: {
        id: "",
        name: "",
        email: "",
        phone: "",
        nationalId: "",
        warnings: 0,
        isActive: 1,
      },
      currentPage: 1, // Current page number
      itemsPerPage: 150,
      branches: [], // Store fetched branches here
      selectedBranch: "", // Number of items per page
    };
  },
  components: {
    Icon,
  },
  computed: {
    // Filter customers based on search fields
    filteredCustomers() {
      return this.customers.filter((customer) => {
        return (
          (customer.name?.toLowerCase() || "").includes(
            this.search.name.toLowerCase()
          ) &&
          (customer.id?.toString() || "").includes(this.search.id) &&
          (customer.phone?.toString() || "").includes(this.search.phone) &&
          (customer.nationalId?.toString() || "").includes(
            this.search.nationalId
          )
        );
      });
    },

    // Slice the filtered customers for the current page
    paginatedCustomers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredCustomers.slice(start, end);
    },

    totalPages() {
      return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    },
  },
  async created() {
    await this.fetchCustomers();
    await this.fetchBranches();
    await this.fetchRooms();
  },
  methods: {
    validateNationalId(nationalId) {
      return /^\d{14}$/.test(nationalId);
    },
    validatePhone(phone) {
      return /^\d{11}$/.test(phone);
    },
    validateEmail(email) {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    },
    formatNationalId() {
      // Remove any non-digit characters
      this.newCustomer.nationalId = this.newCustomer.nationalId.replace(
        /\D/g,
        ""
      );
      // Limit to 14 characters
      if (this.newCustomer.nationalId.length > 14) {
        this.newCustomer.nationalId = this.newCustomer.nationalId.substring(
          0,
          14
        );
      }
    },

    formatPhone() {
      // Remove any non-digit characters
      this.newCustomer.phone = this.newCustomer.phone.replace(/\D/g, "");
      // Limit to 11 characters
      if (this.newCustomer.phone.length > 11) {
        this.newCustomer.phone = this.newCustomer.phone.substring(0, 11);
      }
    },

    validateEmailOnBlur() {
      if (
        this.newCustomer.email &&
        !this.validateEmail(this.newCustomer.email)
      ) {
        alert("Please use a valid email address");
      }
    },

    // For edit form
    formatEditNationalId() {
      this.editCustomerData.nationalId =
        this.editCustomerData.nationalId.replace(/\D/g, "");
      if (this.editCustomerData.nationalId.length > 14) {
        this.editCustomerData.nationalId =
          this.editCustomerData.nationalId.substring(0, 14);
      }
    },

    formatEditPhone() {
      this.editCustomerData.phone = this.editCustomerData.phone.replace(
        /\D/g,
        ""
      );
      if (this.editCustomerData.phone.length > 11) {
        this.editCustomerData.phone = this.editCustomerData.phone.substring(
          0,
          11
        );
      }
    },

    validateEditEmailOnBlur() {
      if (
        this.editCustomerData.email &&
        !this.validateEmail(this.editCustomerData.email)
      ) {
        alert("Please use a email address");
      }
    },
    async fetchRooms() {
      try {
        const response = await axios.get("/api/rooms");
        this.rooms = response.data;
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toastr.error("Failed to load rooms. Please try again.");
      }
    },
    async fetchCustomers() {
      try {
        const response = await axios.get("/api/customers");
        console.log("API Response:", response.data);

        // Map the API response to the expected structure
        this.customers = response.data.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          nationalId: customer.national_id, // Map `national_id` to `nationalId`
          warnings: customer.warnings,
          isActive: customer.is_active, // Map `is_active` to `isActive`
          // Add `blacklisted` field based on `warnings`
          blacklisted: customer.warnings >= 3 ? "Yes" : "No",
        }));
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    },
    async fetchBranches() {
      try {
        // Call the /branches API endpoint
        const response = await axios.get("/api/branches");
        this.branches = response.data; // Store the fetched branches
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    },

    async addCustomer() {
      console.log("Selected Branch ID:", this.selectedBranch);

      // Validate inputs
      if (!this.validateNationalId(this.newCustomer.nationalId)) {
        alert("National ID must be exactly 14 digits");
        return;
      }

      if (!this.validatePhone(this.newCustomer.phone)) {
        alert("Phone number must be exactly 11 digits");
        return;
      }

      if (!this.validateEmail(this.newCustomer.email)) {
        alert("Please use a valid email address");
        return;
      }

      try {
        // Find the branch name based on the selected branch ID
        const selectedBranchObj = this.branches.find(
          (branch) => branch.id === this.selectedBranch
        );
        if (!selectedBranchObj) {
          toastr.error("Invalid branch selected.");
          return;
        }

        // Prepare payload
        const payload = {
          name: this.newCustomer.name,
          email: this.newCustomer.email,
          phone: this.newCustomer.phone,
          national_id: this.newCustomer.nationalId,
          warnings: this.newCustomer.warnings,
          is_active: this.newCustomer.isActive === 1,
          branch: selectedBranchObj.name,
          reservation: this.newCustomer.reservation,
          sharedAreaType: this.newCustomer.sharedAreaType,
          room:
            this.newCustomer.reservation === "Private Room"
              ? this.newCustomer.room
              : null,
        };

        // Add customer to the database
        const customerResponse = await axios.post("/api/customers", payload);

        // Try to check in the customer (separate try-catch to handle check-in failures)
        if (this.newCustomer.autoCheckIn) {
          try {
            let roomName = null;
            if (this.newCustomer.reservation === "Private Room") {
              const selectedRoom = this.rooms.find(
                (room) => room.id === this.newCustomer.room
              );
              if (!selectedRoom) {
                throw new Error("Selected room not found");
              }
              roomName = selectedRoom.name;
            }

            const checkInPayload = {
              customer_id: customerResponse.data.id,
              type:
                this.newCustomer.reservation === "Shared Area"
                  ? this.newCustomer.sharedAreaType
                  : "Private Room",
              room: roomName,
            };

            const endpoint =
              this.newCustomer.reservation === "Shared Area"
                ? "/api/shared-area/check-in"
                : "/api/bookings/check-in";

            await axios.post(endpoint, checkInPayload);
          } catch (checkInError) {
            console.warn("Check-in failed:", checkInError);
            toastr.warning(
              "Customer created but check-in failed. Please check them in manually."
            );
          }
        }

        // Update the local customers list
        this.customers.push({
          id: customerResponse.data.id,
          name: customerResponse.data.name,
          email: customerResponse.data.email,
          phone: customerResponse.data.phone,
          nationalId: customerResponse.data.national_id,
          warnings: customerResponse.data.warnings,
          isActive: customerResponse.data.is_active ? 1 : 0,
          blacklisted: customerResponse.data.warnings >= 3 ? "Yes" : "No",
        });

        // Close the form and reset data
        this.showAddCustomerForm = false;
        this.resetNewCustomer();
        // toastr.success("Customer added successfully and is being checked in!");
        Swal.fire({
          title: "Customer Added Successfully!",
          html: `
        <p>Customer: <strong>${customerResponse.data.name}</strong></p>
        <p>ID: <strong>${customerResponse.data.id}</strong></p>
      `,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error adding customer:", error);

        let errorMessage = "Failed to add customer. Please try again.";

        // Handle specific error cases
        if (error.response) {
          if (error.response.status === 409) {
            errorMessage =
              "Customer already exists with this Email, Phone or National ID";
            // Refresh the customer list to show the existing customer
            this.fetchCustomers();
          } else if (error.response.data?.error) {
            errorMessage = error.response.data.error;
            if (error.response.data.details) {
              errorMessage += `: ${error.response.data.details}`;
            }
          }
        }

        toastr.error(errorMessage);
      }
    },

    // Modify resetNewCustomer to reset the new fields
    resetNewCustomer() {
      this.newCustomer = {
        id: "",
        name: "",
        email: "",
        phone: "",
        nationalId: "",
        warnings: 0,
        isActive: 1,
        reservation: "Shared Area",
        sharedAreaType: "VIP",
        room: "",
      };
    },

    editCustomer(customer) {
      this.customerToEdit = customer; // Store the customer being edited
      this.editCustomerData = { ...customer }; // Pre-fill the edit form
      this.showEditCustomerForm = true; // Show the edit dialog
    },
    async saveEditedCustomer() {
      if (!this.validateNationalId(this.editCustomerData.nationalId)) {
        alert("National ID must be exactly 14 digits");
        return;
      }

      if (!this.validatePhone(this.editCustomerData.phone)) {
        alert("Phone number must be exactly 11 digits");
        return;
      }

      if (!this.validateEmail(this.editCustomerData.email)) {
        alert("Please use a email address");
        return;
      }
      try {
        // Prepare the payload for the API
        const payload = {
          name: this.editCustomerData.name,
          email: this.editCustomerData.email,
          phone: this.editCustomerData.phone,
          national_id: this.editCustomerData.nationalId, // Map `nationalId` to `national_id`
          warnings: this.editCustomerData.warnings,
          is_active: this.editCustomerData.isActive === 1,
          room: "101", // Map `isActive` to `is_active`
        };

        // Send a PUT request to the API
        const response = await axios.put(
          `/api/customers/${this.editCustomerData.id}`,
          payload
        );

        // Log the API response
        console.log("API Response:", response.data);

        // Update the customer in the local `customers` array
        const index = this.customers.findIndex(
          (c) => c.id === this.editCustomerData.id
        );
        if (index !== -1) {
          this.customers[index] = {
            ...this.editCustomerData,
            nationalId: response.data.national_id, // Map `national_id` to `nationalId`
            isActive: response.data.is_active ? 1 : 0, // Map `is_active` to `isActive`
            blacklisted: response.data.warnings >= 3 ? "Yes" : "No", // Recalculate `blacklisted`
          };
        }

        // Close the edit dialog
        this.showEditCustomerForm = false;

        // Show a success message

        toastr.success("Customer updated successfully.");
      } catch (error) {
        console.error("Error updating customer:", error);

        // Show an error message to the user

        toastr.error("Failed to update customer. Please try again.");
      }
    },
    confirmDelete(customer) {
      this.customerToDelete = customer;
      this.showDeleteConfirmation = true;
    },
    async deleteCustomerConfirmed() {
      try {
        // Send a DELETE request to the API
        const response = await axios.delete(
          `/api/customers/${this.customerToDelete.id}`
        );

        // Log the API response
        console.log("API Response:", response.data);

        // Remove the customer from the local `customers` array
        this.customers = this.customers.filter(
          (c) => c.id !== this.customerToDelete.id
        );

        // Close the delete confirmation dialog
        this.showDeleteConfirmation = false;

        // Show a success message

        toastr.success("Customer deleted successfully.");
      } catch (error) {
        console.error("Error deleting customer:", error);

        toastr.success("Failed to delete customer. Please try again.");
      }
    },
    handleImportExcel() {
      this.showExcelImportDialog = true;
    },
    handleFileUpload(event) {
      this.excelFile = event.target.files[0];
    },
    async processExcelFile() {
      if (!this.excelFile) {
        toastr.error("Please select a file.");
        return;
      }

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", this.excelFile); // The key must match the API's expected field name

      try {
        // Send the file to the backend API
        const response = await axios.post("/api/customers/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Required for file uploads
          },
        });

        // Log the API response
        console.log("API Response:", response.data);

        // Add the imported customers to the local `customers` array
        const importedCustomers = response.data.customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          nationalId: customer.national_id, // Map `national_id` to `nationalId`
          warnings: customer.warnings,
          isActive: customer.is_active ? 1 : 0, // Map `is_active` to `isActive`
          blacklisted: customer.warnings >= 3 ? "Yes" : "No", // Calculate `blacklisted`
        }));

        this.customers = [...this.customers, ...importedCustomers];

        // Close the Excel import dialog
        this.showExcelImportDialog = false;

        // Show a success message
        toastr.success(
          `Successfully imported ${importedCustomers.length} customers.`
        );
      } catch (error) {
        console.error("Error uploading file:", error);

        // Show an error message to the user
        toastr.error(
          "Failed to import customers. Please check the file and try again."
        );
      }
    },
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
.buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
.customers-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-count {
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
.custom-table td .btn-edit,
.custom-table td .btn-delete {
  display: inline-block; /* Display buttons inline */
  margin-right: 5px; /* Add spacing between buttons */
}
.custom-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.custom-table tr:hover {
  background-color: #f1f1f1;
}

.blacklist-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.blacklist-tag.danger {
  background-color: #ff4d4f;
  color: white;
}

.blacklist-tag.success {
  background-color: #52c41a;
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
.checkbox-container {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  color: #333;
  font-size: 14px;
  padding-left: 30px; /* Space for custom checkbox */
  margin: 0 auto; /* Center container if needed */
}

/* The actual checkbox input (hidden) */
.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
  left: 0; /* Position over the custom checkbox */
}

/* Custom checkbox */
.checkmark {
  position: absolute;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Checkmark symbol */
.checkmark:after {
  content: "";
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.checkbox-input:checked ~ .checkmark:after {
  opacity: 1;
}

/* Hover and checked states */
.checkbox-container:hover .checkbox-input ~ .checkmark {
  border-color: #3498db;
}

.checkbox-input:checked ~ .checkmark {
  background-color: #3498db;
  border-color: #3498db;
}

/* Label styling */
.checkbox-label {
  margin-left: 8px; /* Space between checkbox and label */
  line-height: 1;
}
</style>
