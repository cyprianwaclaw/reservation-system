<template>
    <Transition>
        <Teleport to="body">
            <div class="modal-conatiner" @click="resetErrors()">
                <div class="blur-background-update" v-if="props.modalActive" @click="$emit('close')" />
                <Transition @before-enter="onBefore" @leave="onLeave">
                    <div class="modal-view p-[20px]" v-if="props.modalActive">
                        <div class="close-icon-div">
                            <Icon name="carbon:close" size="40" class="close-icon -mt-[14px] -mr-[10px]"
                                @click="$emit('close')" />
                        </div>
                        <div class="flex w-full h-full -mt-[23px] p-5">
                            <ModalTemplateVisit :vistId="data" v-if="component === 'visit'" />
                            <ModalTemplateAddPatient :vistId="data" v-if="component === 'addPatient'" />
                            <ModalTemplateAllPatient :patientId="data" v-if="component === 'allPatient'" />
                            <ModalTemplateSchedule :patientId="data" v-if="component === 'schedule'" />
                            <ModalTemplateAddVisit :vistId="data" v-if="component === 'addVisit'" />
                            <ModalTemplateVacation :vistId="data" v-if="component === 'vacation'" />
                        </div>
                    </div>
                </Transition>
            </div>
        </Teleport>
    </Transition>
</template>

<script setup lang="ts">
import gsap from 'gsap'
const { openModal } = useCloseModal()

const { resetErrors } = useErrors();
const emit = defineEmits(['close'])

const props = defineProps<{
    data?: any
    component?: string
    modalActive: boolean
}>()

watch(props, (newValue: any) => {
    newValue.modalActive ? openModal() : ''
    console.log(newValue)
})

const onBefore = (el: any) => {
    gsap.to(el, {
        y: -20,
        duration: 0.3,
    })
}

const onLeave = (el: any, done: () => void) => {
    gsap.to(el, {
        opacity: 0,
        y: 0,
        scale: 1,
        duration: 0,
        ease: 'power2.in',
        onComplete: done,
    })
}

</script>

<style scoped>
.modal-conatiner {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    z-index: 50;
}

.close-icon-div {
    width: 100%;
    display: flex;
    justify-content: flex-end;
}

.go-to-icon {
    color: #89c6d9;
}

.go-to-icon:hover {
    color: #31A9CE;
}

.change-date-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 34px;
    background-color: #ffffff;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
    position: absolute;
    bottom: 0;
    width: 400px;
    height: 324px
}

/* tło do modala */
.v-enter-active,
.v-leave-active {
    transition: opacity 0.4s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

.modal-view {
    background-color: rgb(255, 255, 255);
    width: 950px;
    height: 600px;
    border: solid transparent;
    border-radius: 12px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
}

.blur-background-update {
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(5px);
    width: 100%;
    height: 100vh;
}
</style>