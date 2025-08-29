<template>
    <Modal :component="modalName" :modalActive="showModal" @close="handleModal('allPatient')" />
    <div v-if="!isLoading && router.currentRoute.value?.name !== 'logowanie'"
        class="header flex w-full justify-between place-items-center px-[28px] cursor-default" ref="root"
        :class="router.currentRoute.value?.name === 'index' ? 'sticky top-0 z-50 bg-white' : ''">
        <img class="logo" src="@/assets/images/logo.png" />
        <div class="flex gap-[6px]" v-if="router.currentRoute.value?.name !== 'index'">
            <div class="flex place-items-center gap-[11px] button-action-users select-none"
                @click="handleModal('allPatient')">
                <Icon name="ph:users-bold" size="28" class="primary-color" />
                <p class="font-semibold text-[17px] mt-[1px] text-black-own ">Pacjenci</p>
            </div>
            <Add />
        </div>
        <div v-else class="text-[16px] font-medium flex gap-[21px]">
            <NuxtLink to="/" class="hover:text-gray-500">Fizjoterapia Kaczmarek</NuxtLink>
            <NuxtLink to="/" class="hover:text-gray-500">Centrum Zdrowia Biegacza</NuxtLink>
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
    if (router.currentRoute.value?.name == 'index') {
        isLoading.value = false
    } else {
        setTimeout(() => {
            isLoading.value = false
        }, 1100)
    }
})
</script>
<style scoped>
.header {
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.09);
    height: 86px;
    border: 1px solid #e6e9ef;
}

.logo {
    width: 130px;
}

.button-action-users {
    display: flex;
    align-items: center;
    padding: 9px 19px 9px 16px;
    border-radius: 999px;
    border: 1px solid white;
    cursor: pointer;
    transition: all 0.3s;
}

.button-action-users:hover {
    background: #26a2c81f;
    border: 1px solid #31a9ce5c;
}
</style>
