<template>
    <Transition name="modal-slide">
        <Teleport to="body">
            <div class="modal-conatiner" @click="resetErrors()">
                <Transition name="modal-slide">
                    <div class="blur-background-update" v-if="props.modalActive" @click="$emit('close')" />
                </Transition>
                <Transition @before-enter="onBefore" @leave="onLeave">
                    <div :class="component ? 'modal-view' : 'modal-view-none'" v-if="props.modalActive" ref="modalBox">
                        <div class="center-hr flex">
                            <hr />
                        </div>
                        <div v-if="!component"
                            class="close-icon-div flex w-full justify-between place-items-center -mb-[16px] -mt-[14px]">
                            <p v-if="route.fullPath == '/'" class="flex text-start w-full text-[23px] font-semibold ml-[21px] -mt-[9px]">Szybkie linki</p>
                                <p v-else class="flex text-start w-full text-[23px] font-semibold ml-[21px] -mt-[9px]">Wybierz opcje</p>
                            <div class="w-full text-end">
                                <Icon name="carbon:close" size="43" class="close-icon mr-[7px]" @click="$emit('close')" />
                            </div>
                            <div>
                                
                            </div>
                        </div>
                        <div v-else class="close-icon-div">
                            <Icon name="carbon:close"
                                class="close-icon -mt-[14px] md:-mr-[10px] md:text-[40px] text-[44px] mr-[8px]"
                                @click="$emit('close')" />
                        </div>
                        <Transition name="fade-slide">
                            <div v-if="component" class="flex w-full h-full -mt-[23px] p-5">
                                <ModalTemplateVisit :vistId="data" v-if="component === 'visit'" />
                                <ModalTemplateAddPatient :vistId="data" v-if="component === 'addPatient'" />
                                <ModalTemplateAllPatient :patientId="data" v-if="component === 'allPatient'" />
                                <ModalTemplateSchedule :patientId="data" v-if="component === 'schedule'" />
                                <ModalTemplateAddVisit :visit_data="data" v-if="component === 'addVisit'" />
                                <ModalTemplateVacation :vistId="data" v-if="component === 'vacation'" />
                            </div>
                        </Transition>
                        <div v-if="!component">
                            <div v-if="route.fullPath == '/'" class="flex flex-col gap-[8px] p-4 mt-[10px]">
                                <NuxtLink to="https://centrumzdrowiabiegacza.pl/" target="_blank" rel="noopener noreferrer"
                                    class="option-btn"> Fizjoterapia Kaczmarek</NuxtLink>
                                <NuxtLink to="https://fizjoterapia-kaczmarek.pl/" target="_blank" rel="noopener noreferrer"
                                    class="option-btn">Centrum Zdrowia Biegacza</NuxtLink>
                            </div>
                            <div v-else class="flex flex-col gap-[8px] p-4 mt-[10px]">
                                <button @click="selectComponent('addVisit')" class="option-btn">Dodaj wizytę</button>
                                <button @click="selectComponent('addPatient')" class="option-btn">Dodaj pacjenta</button>
                                <button @click="selectComponent('allPatient')" class="option-btn">Lista pacjentów</button>
                                <button @click="selectComponent('vacation')" class="option-btn">Dodaj wolne</button>
                                <button @click="selectComponent('schedule')" class="option-btn">Godziny pracy</button>
                            </div>
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
const { resetErrors } = useErrors()
const emit = defineEmits(['close'])
const route = useRoute()

const props = defineProps<{
    data?: any
    component?: string
    modalActive: boolean
}>()

const component = ref(props.component ?? '') as any
const modalBox = ref<HTMLElement | null>(null)

watch(() => props.modalActive, (isActive) => {
    if (!isActive) {
        component.value = ''
    } else {
        openModal()
        component.value = props.component ?? ''
    }
})

const selectComponent = (name: string) => {
    if (!modalBox.value) return
    gsap.to(modalBox.value, {
        height: "530px",
        duration: 0.3,
        ease: "power1.out",
        onStart: () => {
            component.value = name
        }
    })
}

const onBefore = (el: HTMLElement) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        gsap.fromTo(el, { y: '100%' }, { y: '0%', opacity: 1, duration: 0.3, ease: "circ.out" });
    } else {
        gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power1.out' });
    }
}

const onLeave = (el: HTMLElement, done: () => void) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        gsap.to(el, { y: '100%', duration: 0.3, ease: "sine.out", onComplete: done });
    } else {
        gsap.to(el, { opacity: 0, duration: 0.15, ease: 'power1.in', onComplete: done });
    }
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

.blur-background-update {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    width: 100%;
    height: 100vh;
}

@media (min-width: 768px) {
    .modal-view {
        background-color: #fff;
        width: 950px;
        height: 600px;
        border-radius: 12px;
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100;
        padding: 20px;
    }
}

@media (max-width: 768px) {
    .modal-view-none {
        background-color: #fff;
        width: 100%;
        height: 382px;
        border-radius: 24px 24px 0 0;
        position: fixed;
        left: 0;
        bottom: 0;
        transform: translateY(0);
        z-index: 100;
        padding: 14px 14px 14px 8px;
        overflow: hidden;
    }

    .modal-view {
        background-color: #fff;
        width: 100%;
        height: 530px;
        border-radius: 24px 24px 0 0;
        position: fixed;
        left: 0;
        bottom: 0;
        transform: translateY(0);
        z-index: 100;
        padding: 14px 1px 14px 1px;
    }

    .center-hr {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: -7px;
        margin-bottom: 32px;
    }

    .center-hr hr {
        color: rgba(209, 209, 209, 0.464);
        width: 40px;
        border: 2px solid;
        border-radius: 999px;
    }

    .option-btn {
        background: #f1f1f1;
        padding: 12px;
        border-radius: 14px;
        text-align: center;
        font-weight: 600;
        font-size: 15px;
    }

    .option-btn:hover {
        background: #e2e2e2;
    }
}

.modal-slide-enter-from {
    opacity: 0;
}

.modal-slide-enter-to {
    opacity: 1;
}

.modal-slide-leave-from {
    opacity: 1;
}

.modal-slide-leave-to {
    opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

@media (max-width: 768px) {
    .modal-slide-leave-active {
        transition-delay: 0.14s;
    }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-leave-to {
    opacity: 0;
    /* transform: translateY(-10px); */
}

.fade-slide-enter-from {
    opacity: 0;
    /* transform: translateY(10px); */
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>