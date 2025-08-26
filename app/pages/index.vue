<template>
  <div class="flex w-ful px-[100px] mx-auto" @click="resetErrors()">
    <div class="flex w-full mt-[70px] mb-[60px]">
      <VisitsNewReserve />
    </div>
    <div class="main-photo flex items-center justify-center">
      <img class="hero-photo" src="@/assets/images/hero-photo.png" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { resetErrors } = useErrors()
</script>

<style scoped>
.main-photo {
  position: sticky;
  top: 20%;
  /* od góry ekranu */
  height: 70vh;
  /* zawsze ta sama wysokość */
  width: 100%;
  display: flex;
  align-items: center;
  /* wyśrodkowanie po Y */
  justify-content: center;
  /* wyśrodkowanie po X */
}

.hero-photo {
  border-radius: 10px !important;
  max-height: 100%;
  /* żeby nie wychodziło poza kontener */
  max-width: 100%;
  object-fit: contain;
  /* zachowanie proporcji */
}
</style>