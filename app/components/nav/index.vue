<template>
    <Modal component="" :modalActive="isOpenMenu" @close="handleModal('')"/>
    <Modal :component="modalName" :modalActive="showModal" @close="handleModal('allPatient')" />
    <div v-if="router.currentRoute.value?.name !== 'logowanie' && !isLoading">
        <div v-if="router.currentRoute.value?.name === 'api-week' && !isLoading"
            class="header-new md:fixed md:top-0 md:left-0 md:h-screen flex md:flex-col items-center justify-between w-full  px-[12px]">
            <img class="md:w-[52px] md:h-[52px]  md:mt-[20px] md:flex hidden" src="@/assets/images/logo-small.png" />
            <img class="flex md:hidden w-[118px] h-[50px]" src="@/assets/images/logo-basic.png" />
            <div class="md:flex flex-col items-center mb-[16px] gap-[4px] hidden">
                <Add />
                <div class="icon-button" @click="handleModal('allPatient')">
                    <Icon name="ph:users-bold" size="25" class="primary-color" />
                </div>
                <div class="icon-button" @click="handleModal('schedule')">
                    <Icon name="ph:calendar-dots-bold" size="26" class="primary-color" />
                </div>
            </div>
            <div class="flex md:hidden" @click="mobileMenu">
                <Icon name="ph:dots-three-vertical-bold" size="32" class="primary-color" />
            </div>
        </div>
        <div v-else class="header flex w-full justify-between place-items-center md:px-[28px] cursor-default" ref="root">
            <img class="logo" src="@/assets/images/logo.png" />
            <div class="text-[16px] font-medium md:flex hidden  gap-[21px]">
                <NuxtLink to="https://fizjoterapia-kaczmarek.pl/" target="_blank" rel="noopener noreferrer"
                    class="hover:text-gray-500">
                    Fizjoterapia Kaczmarek
                </NuxtLink>
                <NuxtLink to="https://centrumzdrowiabiegacza.pl/" target="_blank" rel="noopener noreferrer"
                    class="hover:text-gray-500">
                    Centrum Zdrowia Biegacza
                </NuxtLink>
            </div>
            <div class="flex md:hidden" @click="mobileMenu">
                <Icon name="ph:dots-three-vertical-bold" size="32" class="primary-color" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
const showModal = ref(false);
const isLoading = ref(true)
const modalName = ref('')
const router = useRouter()
const isOpenMenu = ref(false)
const handleModal = (name: string) => {
    modalName.value = name
    console.log(name.length > 0 ? true : false)
    if (name.length > 0 ? true : false) {
        showModal.value = !showModal.value;
    } else {
        mobileMenu()
    }
};

const mobileMenu = () => {
    isOpenMenu.value = !isOpenMenu.value
}
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
@media (min-width: 768px) {

    .header {
        box-shadow: 0 8px 24px rgba(16, 24, 40, 0.09);
        height: 86px;
        border: 1px solid #e6e9ef;
    }

    .logo {
        width: 130px;
    }
}

@media (max-width: 768px) {

    .header {
        box-shadow: 0 8px 24px rgba(16, 24, 40, 0.09);
        height: 72px;
        border: 1px solid #e6e9ef;
        padding: 0px 12px;
        z-index:10;
    }

    .logo {
        width: 114px;
    }
}
</style>
