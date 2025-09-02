<template>
    <div v-if="isLoading">
        <LoadingSpinner :isLoading="true" />
    </div>
    <div v-else class="flex w-full px-[100px] mx-auto mt-[70px]">
        <div class="flex w-full">
            <Transition name="fade-slide">
                <div v-if="isConfirmed" class="confirmation mt-[60px] w-full">
                    <SuccessCheck />
                    <p class="text-[32px] font-semibold mt-[30px]">
                        Twoja wizyta <br>została odwołana
                    </p>
                    <NuxtLink to="/" class="primary-button mt-[30px]">Zarezerwuj kolejną wizytę</NuxtLink>
                </div>
            </Transition>
            <div v-if="!visit">
                <h2 class="text-[40px] font-bold mt-[30px]">Twoja wizyta <br> została już odwałana</h2>
                <NuxtLink to="/" class="primary-button mt-[30px]">Zarezerwuj kolejną wizytę</NuxtLink>
            </div>
            <div v-else>
                <Transition name="fade-slide">
                    <div v-if="isNonConfirmed" class=" mt-[60px]">
                        <p class="text-[15px] text-[#c2c2c2] mb-[6px] font-semibold">
                            Dzień dobry {{ user?.name }}
                        </p>
                        <h2 class="text-[40px] font-bold mb-[10px]">Anulowanie wizyty</h2>
                        <p class="text-[18px] text-gray-600">
                            Czy napewno potwierdzasz odwołanie <br>wizyty zaplanowanej na termin:
                        </p>
                        <p class="text-[18px] text-gray-600 mb-[6px] mt-[21px]">data: <span
                                class="font-semibold underline w-[70px]">{{ visit?.date }}</span></p>
                        <p class="text-[18px] text-gray-600 mb-[2px]">godzina: <span
                                class="font-semibold underline w-[70px]">{{
                                    visit?.start_time }} - {{ visit?.end_time }}</span></p>
                        <button @click="newTerminSave()" class="delete-button mt-[32px]">Odwołaj wizytę</button>
                    </div>
                </Transition>
            </div>
        </div>

        <div class="main-photo flex items-center justify-center">
            <img class="hero-photo" src="@/assets/images/hero-photo.png" />
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const axiosInstance = useNuxtApp().$axiosInstance as any

const confirmed = ref(false)
const isNonConfirmed = ref(true)
const isConfirmed = ref(false)
const user = ref<any>(null)
const visit = ref<any>(null)
const isLoading = ref(true)

const user_id = Number(route.params.user_id)
const visit_id = Number(route.params.visit_id)


onMounted(async () => {
    const resVisit = await axiosInstance.get(`/visits/${visit_id}`)
    visit.value = resVisit.data

    const resUser = await axiosInstance.get(`/users/${user_id}`)
    user.value = resUser.data

    isLoading.value = false
})

const newTerminSave = async () => {
    await axiosInstance.delete(`/schedule/visits/${visit_id}`)
    confirmed.value = true
}

watch(confirmed, async (val) => {
    if (val) {
        isNonConfirmed.value = false
        setTimeout(() => {
            isConfirmed.value = true
        }, 310)
    }
    else {
        isConfirmed.value = false
        setTimeout(() => {
            isNonConfirmed.value = true
        }, 310)
    }
})
</script>

<style scoped>
.delete-button {
    display: inline-block;
    font-weight: 600;
    color: white;
    background: #f43737;
    text-align: center;
    white-space: nowrap;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    padding: 12px 30px;
    font-size: 16px;
    border: 1px solid transparent;
    border-radius: 10px;
    transition: all 0.3s;
    font-family: 'Public Sans', sans-serif;
}

.delete-button:hover {
    background: #e23232;
    cursor: pointer;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s ease;
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>