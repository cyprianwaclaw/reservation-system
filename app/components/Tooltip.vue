<template>
    <div class="tooltip-wrapper" ref="triggerEl" @mouseenter="show = true" @mouseleave="show = false">
        <slot />

        <div v-if="show" class="tooltip" :class="positionClass">
            {{ text }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ text: string }>();

const show = ref(false);
const triggerEl = ref<HTMLElement | null>(null);
const positionClass = ref("top"); // domyślnie nad elementem

watch(show, (val) => {
    if (val && triggerEl.value) {
        const rect = triggerEl.value.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let pos = "top";
        if (rect.top < 60) {
            pos = "bottom"; // za mało miejsca u góry
        } else if (rect.left < 100) {
            pos = "right"; // za blisko lewej
        } else if (rect.right > vw - 100) {
            pos = "left"; // za blisko prawej
        } else if (rect.bottom > vh - 60) {
            pos = "top"; // za mało miejsca na dole → pokaż na górze
        }

        positionClass.value = pos;
    }
});
</script>

<style scoped>
.tooltip-wrapper {
    position: relative;
    display: inline-block;
}

.tooltip {
    position: absolute;
    background: #333;
    color: #fff;
    padding: 6px 10px;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 1000;
    opacity: 0;
    animation: fadeIn 0.2s forwards;
}

.tooltip.top {
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
}

.tooltip.bottom {
    top: 120%;
    left: 50%;
    transform: translateX(-50%);
}

.tooltip.left {
    right: 120%;
    top: 50%;
    transform: translateY(-50%);
}

.tooltip.right {
    left: 120%;
    top: 50%;
    transform: translateY(-50%);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-2px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>