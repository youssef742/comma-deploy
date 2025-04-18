import { createApp } from "vue"; // Import createApp from Vue
import App from "./App.vue"; // Import the root component
import router from "./router"; // Import the router
import store from "./store/store"; // Import the Vuex store
import axios from "axios";

// Create the Vue app
const app = createApp(App);
axios.defaults.baseURL = "";
// Use the router and store
app.use(router);
app.use(store);

// Mount the app
app.mount("#app");
