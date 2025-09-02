<template>
  <div v-if="isLoading">
    <LoadingSpinner :isLoading="true" />
  </div>
  <div   class="flex w-ful px-[100px] mx-auto" @click="resetErrors()">
    <div class="flex w-full mt-[70px] mb-[60px]">
      <VisitsNewReserve @isLoading="loadingValue" />
    </div>
    <div class="main-photo flex items-center justify-center">
      <img class="hero-photo" src="@/assets/images/hero-photo.png" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { resetErrors } = useErrors()
const isLoading = ref(true)

const loadingValue = (value: any) => {
  isLoading.value = value
}

</script>