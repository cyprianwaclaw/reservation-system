<template>
  <div v-if="isLoading">
    <LoadingSpinner :isLoading="true" />
  </div>
  <div   class="flex w-ful md:px-[100px] mx-auto px-[24px]" @click="resetErrors()">
    <div class="flex w-full md:mt-[70px] md:mb-[60px] mt-[36px] mb-[32px]">
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