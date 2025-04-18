<template>
  <div class="rooms-container">
    <!-- Header with Add New Button -->
    <div class="header">
      <button class="btn-primary" @click="showAddRoomForm = true">
        Add New Room
      </button>
      <span class="room-count">No. Rooms: {{ rooms.length }}</span>
    </div>

    <!-- Search Field -->
    <div class="search-fields">
      <input
        v-model="search.id"
        placeholder="Search With Search Id"
        class="search-input"
      />
    </div>

    <!-- Rooms Table -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Branch Name</th>
          <th>Type</th>
          <th>Capacity</th>
          <th>Price</th>
          <th>Price Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Display rooms if available -->
        <tr v-for="room in paginatedRooms" :key="room.id">
          <td>{{ room.id }}</td>
          <td>{{ room.name }}</td>
          <td>{{ room.branch_name }}</td>
          <td>{{ room.type }}</td>
          <td>{{ room.capacity }}</td>
          <td>{{ room.price }}</td>
          <td>{{ room.price_type === "hour" ? "Per Hour" : "Per Day" }}</td>
          <td>
            <button class="btn-edit" @click="editRoom(room)">Edit</button>
            <button class="btn-delete" @click="confirmDelete(room)">
              Delete
            </button>
          </td>
        </tr>

        <!-- Display "No results" row if the table is empty -->
        <tr v-if="paginatedRooms.length === 0">
          <td colspan="8" class="no-results">No results</td>
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

    <!-- Add Room Form Dialog -->
    <div v-if="showAddRoomForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Add New Room</h2>
        <form @submit.prevent="addRoom" class="rooms-form">
          <div class="form-group">
            <label for="name">Name:</label>
            <input v-model="newRoom.name" id="name" required />
          </div>
          <div class="form-group">
            <label for="branch_name">Branch Name:</label>
            <input v-model="newRoom.branch_name" id="branch_name" required />
          </div>
          <div class="form-group">
            <label for="type">Type:</label>
            <input v-model="newRoom.type" id="type" required />
          </div>
          <div class="form-group">
            <label for="capacity">Capacity:</label>
            <input
              v-model="newRoom.capacity"
              id="capacity"
              type="number"
              required
            />
          </div>
          <div class="form-group">
            <label for="price">Price:</label>
            <input v-model="newRoom.price" id="price" type="number" required />
          </div>
          <div class="form-group">
            <label for="price-type">Price Type:</label>
            <select v-model="newRoom.price_type" id="price-type" required>
              <option value="hour">Per Hour</option>
              <option value="day">Per Day</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddRoomForm = false">
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Room Form Dialog -->
    <div v-if="showEditRoomForm" class="dialog-overlay">
      <div class="dialog">
        <h2>Edit Room</h2>
        <form @submit.prevent="saveEditedRoom" class="rooms-form">
          <div class="form-group">
            <label for="edit-name">Name:</label>
            <input v-model="editRoomData.name" id="edit-name" required />
          </div>
          <div class="form-group">
            <label for="edit-branch_name">Branch Name:</label>
            <input
              v-model="editRoomData.branch_name"
              id="edit-branch_name"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-type">Type:</label>
            <input v-model="editRoomData.type" id="edit-type" required />
          </div>
          <div class="form-group">
            <label for="edit-capacity">Capacity:</label>
            <input
              v-model="editRoomData.capacity"
              id="edit-capacity"
              type="number"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-price">Price:</label>
            <input
              v-model="editRoomData.price"
              id="edit-price"
              type="number"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-price-type">Price Type:</label>
            <select
              v-model="editRoomData.price_type"
              id="edit-price-type"
              required
            >
              <option value="hour">Per Hour</option>
              <option value="day">Per Day</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showEditRoomForm = false">
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
        <p>Are you sure you want to delete this room?</p>
        <div class="form-actions">
          <button type="button" @click="showDeleteConfirmation = false">
            Cancel
          </button>
          <button type="button" @click="deleteRoomConfirmed" class="btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import toastr from "toastr";
import "toastr/build/toastr.min.css";

export default {
  data() {
    return {
      rooms: [], // List of rooms
      search: {
        id: "", // Search by ID
      },
      showAddRoomForm: false,
      showEditRoomForm: false,
      showDeleteConfirmation: false,
      roomToDelete: null,
      roomToEdit: null,
      newRoom: {
        id: "",
        name: "",
        branch_name: "", // Updated to branch_name
        type: "",
        capacity: 0,
        price: 0,
        price_type: "hour",
      },
      editRoomData: {
        id: "",
        name: "",
        branch_name: "", // Updated to branch_name
        type: "",
        capacity: 0,
        price: 0,
        price_type: "hour",
      },
      currentPage: 1, // Current page number
      itemsPerPage: 10, // Number of items per page
    };
  },
  computed: {
    // Filter rooms based on search fields
    filteredRooms() {
      return this.rooms.filter((room) => {
        // Ensure room.id is defined and convert it to a string
        const roomId = room.id ? room.id.toString() : "";
        return roomId.includes(this.search.id);
      });
    },
    // Paginate the filtered rooms
    paginatedRooms() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredRooms.slice(start, end);
    },
    // Calculate total number of pages
    totalPages() {
      return Math.ceil(this.filteredRooms.length / this.itemsPerPage);
    },
  },
  methods: {
    // Fetch rooms from the backend
    async fetchRooms() {
      try {
        const response = await fetch("/api/rooms");
        this.rooms = await response.json();
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toastr.error(":( Failed to load room, please try again or support!");
      }
    },
    // Add a new room
    async addRoom() {
      try {
        const response = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.newRoom), // Send newRoom directly
        });

        if (!response.ok) {
          throw new Error("Failed to add room");
        }

        const newRoom = await response.json();

        // Add the new room to the local list
        this.rooms.push(newRoom);

        this.showAddRoomForm = false;
        this.resetNewRoom();
        toastr.success("Room added successfully!");
      } catch (error) {
        console.error("Error adding room:", error);
        toastr.error("Failed to add room!");
      }
    },

    // Reset the new room form
    resetNewRoom() {
      this.newRoom = {
        id: "",
        name: "",
        branch_name: "", // Updated to branch_name
        type: "",
        capacity: 0,
        price: 0,
        price_type: "hour",
      };
    },

    // Edit a room
    editRoom(room) {
      this.roomToEdit = room;
      this.editRoomData = { ...room };
      this.showEditRoomForm = true;
    },

    // Save edited room
    async saveEditedRoom() {
      try {
        const response = await fetch(`/api/rooms/${this.roomToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.editRoomData), // Send editRoomData directly
        });

        if (!response.ok) {
          throw new Error("Failed to update room");
        }

        const updatedRoom = await response.json();

        // Update the room in the local list
        const index = this.rooms.findIndex((r) => r.id === updatedRoom.id);
        if (index !== -1) {
          this.rooms[index] = updatedRoom;
        }

        this.showEditRoomForm = false;
        toastr.success("Room was updated successfully!");
      } catch (error) {
        console.error("Error updating room:", error);
        toastr.error("Failed, Room was not updated.");
      }
    },

    // Confirm delete
    confirmDelete(room) {
      this.roomToDelete = room;
      this.showDeleteConfirmation = true;
    },

    // Delete a room after confirmation
    async deleteRoomConfirmed() {
      try {
        await fetch(`/api/rooms/${this.roomToDelete.id}`, {
          method: "DELETE",
        });
        this.rooms = this.rooms.filter((r) => r.id !== this.roomToDelete.id);
        this.showDeleteConfirmation = false;
        toastr.success("Room was deleted successfully!");
      } catch (error) {
        console.error("Error deleting room:", error);
        toastr.error("Failed to deleted room.");
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
  mounted() {
    this.fetchRooms();
  },
};
</script>
<style scoped>
.rooms-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.room-count {
  font-size: 1.2rem;
  font-weight: bold;
}

.search-fields {
  margin-bottom: 20px;
}

.search-input {
  padding: 8px;
  border: 2px solid #ffd700;
  border-radius: 4px;

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
  text-align: left;
  padding: 8px;
}

.custom-table th {
  background-color: #ffd700;
  font-weight: bold;
  color: black;
}

.custom-table td {
  background-color: white;
  color: black;
}

.custom-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.custom-table tr:hover {
  background-color: #f1f1f1;
}

.no-results {
  text-align: center;
  font-style: italic;
  color: #888;
  padding: 20px;
}

.btn-primary,
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
