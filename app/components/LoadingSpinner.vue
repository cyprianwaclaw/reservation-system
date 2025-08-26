<template>
    <div class="spinner-overlay" v-if="isLoading">
        <div class="pulse-loader">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    isLoading: boolean
}>();
</script>

<style scoped>
.spinner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    /* background-color: rgba(255, 255, 255, 0.7); */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.pulse-loader {
    display: flex;
    gap: 10px;
}

.pulse-loader span {
    width: 15px;
    height: 15px;
    background: #3498db;
    border-radius: 50%;
    animation: pulse 0.8s infinite ease-in-out;
}

.pulse-loader span:nth-child(2) {
    animation-delay: 0.2s;
}

.pulse-loader span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulse {

    0%,
    80%,
    100% {
        transform: scale(0.6);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }

}
</style>