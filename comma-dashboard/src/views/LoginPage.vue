<template>
  <div class="login-container">
    <div class="logo">
      <img :src="require('../assets/comma.png')" alt="Logo" />
    </div>
    <div class="login-form">
      <h2>Enter Your Credentials..</h2>
      <form @submit.prevent="login">
        <input type="text" placeholder="National ID" v-model="username" />
        <input type="password" placeholder="Password" v-model="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    async login() {
      try {
        await this.$store.dispatch("login", {
          national_id: this.username,
          password: this.password,
        });

        // Redirect to home after successful login
        this.$router.push("/home");
      } catch (error) {
        // Error will be shown from the store's state
        console.error("Login error:", error);
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000;
  color: #ffd700;
}

.login-form {
  background-color: #222;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 30%;
  height: auto;
}

input {
  display: block;
  margin: 10px 0;
  padding: 10px;
  width: 100%;
  border: 1px solid #ffd700;
  border-radius: 5px;
  background-color: #333;
  color: #ffd700;
  box-sizing: border-box;
}

button {
  padding: 10px 20px;
  background-color: #ffd700;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #e6b800;
}
</style>
