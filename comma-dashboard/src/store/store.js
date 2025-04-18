import { createStore } from "vuex"; // Import createStore from Vuex

// Create and export the Vuex store
export default createStore({
  state: {
    role: null, // This will store the user's role
  },
  mutations: {
    setRole(state, role) {
      state.role = role;
    },
  },
  actions: {
    setRole({ commit }, role) {
      commit("setRole", role);
    },
  },
  getters: {
    getRole(state) {
      return state.role;
    },
  },
});
