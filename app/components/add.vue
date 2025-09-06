<template>
    <Modal :component="modalName" :modalActive="showModal" :data="vistId" @close="handleModal('visit')" />
    <div ref="root">
        <div class="icon-button" @click="isOpenAdd = !isOpenAdd">
            <Icon name="ph:plus-bold" size="25" class="primary-color" />
        </div>
        <Teleport to="body">
            <div class="adding-container select-none" v-if="isOpenAdd">
                <div class="flex w-full flex-col">
                    <p class="text-add" @click="handleModal('addVisit')">Wizytę</p>
                    <p class="text-add" @click="handleModal('addPatient')">Pacjenta</p>
                    <p class="text-add"  @click="handleModal('vacation')">Wolne</p>
                </div>
            </div>
        </Teleport>
    </div>
</template>
<script setup lang="ts">
const { isModalOpen } = useCloseModal()

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
  position: absolute;
  bottom: 50px;
  left: 76px;
  width: 200px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 9px 0px;
  border: 1px solid #e6e9ef;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.15);
  z-index: 99999;
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
</style>
