<template>
  <div>
    <h1>Employees</h1>
    <button @click="openAddEmployeeModal">Add New Employee</button>
    <p>Total Employees: {{ employeeCount }}</p>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>National ID</th>
          <th>Branch</th>
          <th>Mobile Number</th>
          <th>Faculty</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee.id">
          <td>{{ employee.name }}</td>
          <td>{{ employee.role }}</td>
          <td>{{ employee.national_id }}</td>
          <td>{{ employee.branch }}</td>
          <td>{{ employee.age }}</td>
          <td>{{ employee.faculty }}</td>
          <td>
            <button
              style="
                background-color: #409eff;
                color: white;
                margin-right: 10px;
              "
              @click="openEditEmployeeModal(employee)"
            >
              Edit
            </button>
            <button class="btn-delete" @click="confirmDelete(employee)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Employee Modal -->
    <div v-if="showAddModal" class="modal">
      <div class="modal-content">
        <h2>Add Employee</h2>
        <input v-model="newEmployee.name" placeholder="Name" />
        <input
          v-model="newEmployee.password"
          placeholder="Password"
          type="password"
        />
        <select v-model="newEmployee.role">
          <option value="Receptionist">admin</option>
          <option value="CEO">CEO</option>
          <option value="Branch Manager">Branch Manager</option>
        </select>
        <input v-model="newEmployee.national_id" placeholder="National ID" />
        <select v-model="newEmployee.branch">
          <option value="Manyal">Manyal</option>
          <option value="Nasr City">Nasr City</option>
          <option value="Dokki">Dokki</option>
        </select>
        <input
          v-model="newEmployee.age"
          placeholder="Mobile number"
          type="number"
        />
        <input v-model="newEmployee.faculty" placeholder="Faculty" />
        <button @click="addEmployee">Save</button>
        <button @click="closeAddEmployeeModal">Cancel</button>
      </div>
    </div>

    <!-- Edit Employee Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h2>Edit Employee</h2>
        <input v-model="editEmployee.name" placeholder="Name" />
        <input
          v-model="editEmployee.password"
          placeholder="Password"
          type="password"
        />
        <select v-model="editEmployee.role">
          <option value="Receptionist">Receptionist</option>
          <option value="CEO">CEO</option>
          <option value="Branch Manager">Branch Manager</option>
        </select>
        <input v-model="editEmployee.national_id" placeholder="National ID" />
        <select v-model="editEmployee.branch">
          <option value="Manyal">Manyal</option>
          <option value="Nasr City">Nasr City</option>
          <option value="Dokki">Dokki</option>
        </select>
        <input
          v-model="editEmployee.age"
          placeholder="Mobile Number"
          type="number"
        />
        <input v-model="editEmployee.faculty" placeholder="Faculty" />
        <button @click="updateEmployee">Save</button>
        <button @click="closeEditEmployeeModal">Cancel</button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirmation" class="dialog-overlay">
      <div class="dialog">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this employee?</p>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button
            type="button"
            @click="deleteEmployeeConfirmed"
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
      employees: [],
      employeeCount: 0,
      showAddModal: false,
      showEditModal: false,
      showDeleteConfirmation: false, // Controls the visibility of the delete confirmation dialog
      selectedEmployee: null, // Stores the employee selected for deletion
      newEmployee: {
        name: "",
        password: "",
        role: "Receptionist",
        national_id: "",
        branch: "Manyal", // Default branch
        age: null,
        faculty: "",
      },
      editEmployee: {
        id: null,
        name: "",
        password: "",
        role: "Receptionist",
        national_id: "",
        branch: "Manyal", // Default branch
        age: null,
        faculty: "",
      },
    };
  },
  async created() {
    await this.fetchEmployees();
    await this.fetchEmployeeCount();
  },
  methods: {
    // Fetch all employees
    async fetchEmployees() {
      try {
        const response = await axios.get("/api/employees");
        console.log("API Response:", response.data); // Debugging
        this.employees = response.data;
      } catch (error) {
        console.error("Error fetching employees:", error);
        toastr.error("Failed to load employees, Please call the admin!");
      }
    },
    // Fetch employee count
    async fetchEmployeeCount() {
      try {
        const response = await axios.get("/api/employees/count");
        this.employeeCount = response.data.count;
      } catch (error) {
        console.error("Error fetching employee count:", error);
        toastr.error("Failed to fetch employee count, Please call the admin!");
      }
    },
    // Open the "Add Employee" modal
    openAddEmployeeModal() {
      this.showAddModal = true;
    },
    // Close the "Add Employee" modal
    closeAddEmployeeModal() {
      this.showAddModal = false;
      this.newEmployee = {
        name: "",
        password: "",
        role: "Receptionist",
        national_id: "",
        branch: "Manyal",
        age: null,
        faculty: "",
      };
    },
    // Add a new employee
    async addEmployee() {
      try {
        const payload = {
          name: this.newEmployee.name,
          password: this.newEmployee.password,
          role: this.newEmployee.role,
          national_id: this.newEmployee.national_id,
          branch: this.newEmployee.branch,
          age: this.newEmployee.age,
          faculty: this.newEmployee.faculty,
        };
        console.log("Sending payload:", payload);
        const response = await axios.post("/api/employees", payload);
        this.employees.push(response.data);
        this.closeAddEmployeeModal();
        await this.fetchEmployeeCount();
        toastr.success("Employee added successfully!");
      } catch (error) {
        console.error("Error adding employee:", error);
        toastr.error("Failed to add employee. Please check employee data.");
      }
    },
    // Open the "Edit Employee" modal
    openEditEmployeeModal(employee) {
      this.editEmployee = { ...employee, password: "" };
      this.showEditModal = true;
    },
    // Close the "Edit Employee" modal
    closeEditEmployeeModal() {
      this.showEditModal = false;
      this.editEmployee = {
        id: null,
        name: "",
        password: "",
        role: "Receptionist",
        national_id: "",
        branch: "Manyal",
        age: null,
        faculty: "",
      };
    },
    // Update an employee
    async updateEmployee() {
      try {
        const payload = {
          name: this.editEmployee.name,
          password: this.editEmployee.password,
          role: this.editEmployee.role,
          national_id: this.editEmployee.national_id,
          branch: this.editEmployee.branch,
          age: this.editEmployee.age,
          faculty: this.editEmployee.faculty,
        };

        const response = await axios.put(
          `/api/employees/${this.editEmployee.id}`,
          payload
        );

        const index = this.employees.findIndex(
          (e) => e.id === this.editEmployee.id
        );
        if (index !== -1) {
          this.employees[index] = response.data;
        }

        this.closeEditEmployeeModal();
        toastr.success("Employee updated successfully!");
      } catch (error) {
        console.error("Error updating employee:", error);
        toastr.error("Failed to update employee. Please try again.");
      }
    },
    // Show the delete confirmation dialog
    confirmDelete(employee) {
      this.selectedEmployee = employee; // Store the selected employee
      this.showDeleteConfirmation = true; // Show the confirmation dialog
    },
    // Handle confirmed deletion
    async deleteEmployeeConfirmed() {
      if (this.selectedEmployee) {
        try {
          await axios.delete(`/api/employees/${this.selectedEmployee.id}`);
          this.employees = this.employees.filter(
            (e) => e.id !== this.selectedEmployee.id
          );
          await this.fetchEmployeeCount();
          toastr.success("Employee deleted successfully!");
        } catch (error) {
          console.error("Error deleting employee:", error);
          toastr.error("Failed to delete employee. Please try again.");
        } finally {
          this.showDeleteConfirmation = false; // Hide the confirmation dialog
          this.selectedEmployee = null; // Clear the selected employee
        }
      }
    },
  },
};
</script>
<style scoped>
/* Container styling */
div {
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* Header styling */
h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

/* Button styling */
button {
  background-color: #4caf50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #45a049;
}

/* Table styling */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  border-radius: 10px;
}

th,
td {
  border: 1px solid #cc9c0d;
  text-align: left;
}
td {
  text-align: center;
  background-color: white;
  color: black;
  padding: 8px;
  white-space: nowrap;
}
th {
  background-color: #ffd700;
  font-weight: bold;
  color: black;
  padding: 12px;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}

/* Modal styling */
.modal {
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

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-bottom: 20px;
  font-size: 20px;
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.modal-content button {
  margin-right: 10px;
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-delete {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete:hover {
  background-color: #ff7875;
}
</style>
