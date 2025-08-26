<template>
    <div class="flex justify-start items-start mb-[14px]">
        <div v-if="!visible" class="w-[80px] h-[80px]"></div>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-[80px] h-[80px]">
            <circle class="checkmark-circle" cx="32" cy="32" r="28" fill="none" />
            <path class="checkmark-check" fill="none" d="M18 34l9 9 20-20" />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const visible = ref(false);

onMounted(() => {
    setTimeout(() => {
        visible.value = true;
    }, 200);
});
</script>

<style scoped>
.checkmark-circle {
    stroke: #1eca5a;
    stroke-width: 5;
    /* grubszy stroke */
    stroke-dasharray: 180;
    stroke-dashoffset: 180;
    stroke-linecap: round;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
    stroke: #1eca5a;
    stroke-width: 5;
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    stroke-linecap: round;
    animation: stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards 0.6s;
}

@keyframes stroke {
    100% {
        stroke-dashoffset: 0;
    }
}
</style>