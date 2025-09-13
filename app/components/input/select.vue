<template>
    <div class="custom-select w-full relative" ref="root"
    :class="{'disabled-own': disabled }"
    >
        <div class="select-box border rounded p-2 w-full cursor-pointer flex justify-between items-center"
            :class="{ 'border-open': isOpen }" @click="toggleDropdown">
            <span :class="selectedLabel ? '' : 'placeholder'">{{ selectedLabel || placeholder }}</span>
            <Icon name="ph:caret-down-bold" size="20" class="close-icon transition-transform duration-300"
                :class="{ 'rotate-180': isOpen }" />
        </div>
        <!-- max-h-48  -->
        <div v-show="isOpen" :class="props.type==='hour' ? ' max-h-[150px]' : ' max-h-48'"
            class="options absolute w-full overflow-y-auto border rounded mt-1 bg-white z-50 shadow-lg">
            <div v-for="option in options" :key="option.value" class="option p-2 hover:bg-blue-100 cursor-pointer"
                @click="selectOption(option)">
                <p class="option-label">
                    {{ option.label }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

interface Option {
    value: string | number;
    label: string;
}

const props = defineProps<{
    modelValue: any;
    options: Option[];
    placeholder?: string;
    label?: string;
    type?: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
}>();

const isOpen = ref(false);

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const selectOption = (option: Option) => {
    emit('update:modelValue', option.value);
    isOpen.value = false;
};

const selectedLabel = computed(() => {
    const selected = props.options.find(opt => opt.value === props.modelValue);
    return selected ? selected.label : '';
});
const root = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
    if (root.value && !root.value.contains(event.target as Node)) {
        isOpen.value = false;
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
.rotate-180 {
    transform: rotate(1deg);
}

.placeholder {
    color: #cacaca;
    font-size: 16px;
}

.select-box {
    background-color: white;
    user-select: none;
    border-radius: 12px;
    border: 2px solid #dedede;
    padding: 10px 15px;
    transition: 0.25s all;
    outline: none;
}
.border-open{
    border: 2px solid  #31a9ce;
}

.options {
    border: 1px solid #ccc;
    padding: 7px 0px;
    border-radius: 10px;
    background-color: white;
    overflow-y: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 100;
}

.option-label{
padding: 0px 6px;

}
.option:hover {
    background-color: #e0f2fe;
}
.disabled-own{
    pointer-events:none
}

</style>