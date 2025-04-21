import { createStore } from "vuex";

export default createStore({
  state: {
    role: localStorage.getItem("userRole") || null,
    user: JSON.parse(localStorage.getItem("userData")) || null,
    loading: false,
    error: null,
  },
  mutations: {
    setRole(state, role) {
      state.role = role;
      localStorage.setItem("userRole", role);
    },
    setUser(state, user) {
      state.user = user;
      localStorage.setItem("userData", JSON.stringify(user));
    },
    setLoading(state, isLoading) {
      state.loading = isLoading;
    },
    setError(state, error) {
      state.error = error;
    },
    clearAuthData(state) {
      state.role = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("userRole");
      localStorage.removeItem("userData");
    },
  },
  actions: {
    async login({ commit }, { national_id, password }) {
      commit("setLoading", true);
      commit("setError", null);

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            national_id,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        // Commit the role to state and localStorage
        commit("setRole", data.role);

        // Store additional user data if available
        if (data.user) {
          commit("setUser", data.user);
        } else {
          // If no user data in response, store at least the national_id
          commit("setUser", { national_id });
        }

        return data; // Return data for component to handle redirection
      } catch (error) {
        commit("setError", error.message || "An error occurred during login");
        throw error; // Re-throw to handle in component
      } finally {
        commit("setLoading", false);
      }
    },
    logout({ commit }) {
      commit("clearAuthData");
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.role,
    getRole: (state) => state.role,
    getUser: (state) => state.user,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },
});
