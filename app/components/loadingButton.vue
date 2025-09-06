<template>
  <div class="button-wrapper">
    <div v-if="props.isLoading" class="primary-button loading-button" :style="{ width: buttonWidth + 'px' }"
      ref="loadingBtn">
      <div class="spinner-container">
        <svg class="spinner" width="24px" height="24px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
          <circle class="path" fill="none" stroke-width="10" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
        </svg>
      </div>
    </div>
    <button v-else class="primary-button" ref="normalBtn" @mounted="setWidth">
      {{ props.text }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  isLoading: Boolean,
  text: {
    type: String,
    required: true,
  },
})

const normalBtn = ref<HTMLElement | null>(null)
const loadingBtn = ref<HTMLElement | null>(null)
const buttonWidth = ref<number>(0)

function setWidth() {
  nextTick(() => {
    if (normalBtn.value) {
      buttonWidth.value = normalBtn.value.offsetWidth
    }
  })
}

watch(() => props.isLoading, (newVal) => {
  if (!newVal) {
    setWidth()
  }
})

onMounted(() => {
  setWidth()
})
</script>

<style scoped>
.button-wrapper {
  display: inline-block;
}

.loading-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #31a9ce76;
  cursor: not-allowed;
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  animation: rotator 1s linear infinite;
}

@keyframes rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.path {
  stroke-dasharray: 187;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash 1s ease-in-out infinite, colors 4s ease-in-out infinite;
}

@keyframes dash {
  0% {
    stroke-dashoffset: 187;
  }
  50% {
    stroke-dashoffset: 46.75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 187;
    transform: rotate(360deg);
  }
}

@keyframes colors {
  0%, 25%, 50%, 75%, 100% {
    stroke: #247f9b;
  }
}
</style>