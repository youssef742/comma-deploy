<template>
  <div class="shared-area-selection">
    <h1>Select Shared Area</h1>
    <div class="shared-area-boxes">
      <div class="box" @click="navigateToSharedAreaTable('All')">
        <h2>
          <Icon icon="mdi:clipboard-list-outline" width="50px" height="50px" />
          All Check-ins
        </h2>
      </div>
      <div class="box" @click="navigateToSharedAreaTable('VIP')">
        <h2><Icon icon="ri:vip-fill" width="50px" height="50px" />VIP Area</h2>
      </div>
      <div class="box" @click="navigateToSharedAreaTable('Quiet Area')">
        <h2>
          <Icon
            icon="material-symbols:quiet-time-active"
            width="50px"
            height="50px"
          />Quiet Area
        </h2>
      </div>
      <div class="box" @click="navigateToSharedAreaTable('General Area')">
        <h2>
          <Icon icon="mdi:account-group" width="50px" height="50px" />General
          Area
        </h2>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue";

export default {
  components: { Icon },
  methods: {
    navigateToSharedAreaTable(type) {
      this.$router.push({ path: `/shared-area-table/${type}` });
    },
  },
};
</script>

<style scoped>
.shared-area-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.shared-area-boxes {
  display: flex;
  gap: 20px;
}

.box {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  width: 200px;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.box h2 {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}
.box:hover {
  background-color: #f0f0f0;
}
</style>
