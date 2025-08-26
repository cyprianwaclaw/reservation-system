const isModalOpen = ref(false)

export function useCloseModal() {
    const openModal = () => {
        isModalOpen.value = true
    }

    const closeModal = () => {
        isModalOpen.value = false
    }

    return {
        isModalOpen,
        openModal,
        closeModal,
    }
}