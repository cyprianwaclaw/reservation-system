<template>
    <Modal :component="modalName" :modalActive="showModal" @close="handleModal('allPatient')" />
    <div v-if="router.currentRoute.value?.name !== 'logowanie' && !isLoading">
        <div v-if="router.currentRoute.value?.name === 'api-week' && !isLoading"
            class="header-new fixed top-0 left-0 h-screen flex flex-col items-center justify-between">
            <img class="w-[58px] h-[58px] mt-[20px]" src="@/assets/images/logo-small.png" />
            <div class="flex flex-col items-center mb-[16px] gap-[5px]">
                <Add />
                <div class="icon-button" @click="handleModal('allPatient')">
                    <Icon name="ph:users-bold" size="28" class="primary-color" />
                </div>
                <div class="icon-button" @click="handleModal('schedule')">
                    <Icon name="ph:calendar-blank-bold" size="29" class="primary-color" />
                </div>
            </div>
        </div>
        <div v-else class="header flex w-full justify-between place-items-center px-[28px] cursor-default" ref="root">
            <img class="logo" src="@/assets/images/logo.png" />
            <div class="text-[16px] font-medium flex gap-[21px]">
                <NuxtLink to="https://fizjoterapia-kaczmarek.pl/" target="_blank" rel="noopener noreferrer"
                    class="hover:text-gray-500">
                    Fizjoterapia Kaczmarek
                </NuxtLink>
                <NuxtLink to="https://centrumzdrowiabiegacza.pl/" target="_blank" rel="noopener noreferrer"
                    class="hover:text-gray-500">
                    Centrum Zdrowia Biegacza
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
const showModal = ref(false);
const isLoading = ref(true)
const modalName = ref('')
const router = useRouter()

const handleModal = (name: string) => {
    modalName.value = name
    showModal.value = !showModal.value;
};
onMounted(() => {
    if (router.currentRoute.value?.name === 'api-week') {
        setTimeout(() => {
            isLoading.value = false
        }, 960)
    } else {
        isLoading.value = false
    }
})
</script>
<style scoped>
.header {
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.09);
    height: 86px;
    border: 1px solid #e6e9ef;
}

.header-new {
    width: 80px;
    border-right: 2px solid #e6e9ef;
    background: #fff;
}

.logo {
    width: 130px;
}
</style>
