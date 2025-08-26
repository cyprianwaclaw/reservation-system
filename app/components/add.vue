<template>
    <Modal :component="modalName" :modalActive="showModal" :data="vistId" @close="handleModal('visit')" />
    <div ref="root">
        <div class="flex place-items-center gap-[6px] button-action select-none" @click="isOpenAdd = !isOpenAdd">
            <Icon name="ph:plus-bold" size="28" class="primary-color" />
            <p class="font-semibold text-[17px] mt-[1px] text-black-own ">Dodaj</p>
        </div>
        <div class="adding-container select-none" v-if="isOpenAdd">
            <div class="flex w-full flex-col">
                <p class="text-add" @click="handleModal('addVisit')">Wizytę</p>
                <p class="text-add" @click="handleModal('addPatient')">Pacjenta</p>
                <p class="text-add"  @click="handleModal('vacation')">Wolne</p>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
const { isModalOpen, openModal, closeModal } = useCloseModal()

const isOpenAdd = ref(false)
const root = ref<HTMLElement | null>(null);
const showModal = ref(false);
const vistId = ref() as any
const modalName = ref('')


const handleModal = (name: string) => {
    modalName.value = name
    isOpenAdd.value = false;
    showModal.value = !showModal.value;
}

watch(isModalOpen, (newValue: any) => {
    if (newValue === false) {
        showModal.value = false
    }
})

const handleClickOutside = (event: MouseEvent) => {
    if (root.value && !root.value.contains(event.target as Node)) {
        isOpenAdd.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.adding-container {
    top: 73px;
    right: 30px;
    width: 200px;
    position: absolute;
    background-color: #ffffff;
    border-radius: 10px;
    padding: 9px 0px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.15);
    z-index: 10000;
}

.text-add {
    width: 100%;
    font-size: 18px;
    font-weight: 500;
    padding: 6px 21px;
    font-size: 18px;
}

.text-add:hover {
    cursor: pointer;
    background-color: #e0f2fe;
}

.button-action {
    display: flex;
    align-items: center;
    padding: 9px 19px 9px 14px;
    border-radius: 999px;
    border: 1px solid white;
    cursor: pointer !important;
    transition: all 0.3s;
}


.button-action:hover {
    background: #26a2c81f;
    border: 1px solid #31a9ce5c;
}
</style>
