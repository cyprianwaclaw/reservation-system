<template>
    <div class="relative w-full" ref="root">
        <div class="flex relative">
            <Icon name="ph:magnifying-glass" size="28" class="text-[#cacaca] absolute top-[10px] left-[13px]" />
            <input type="text" class="serach-input" :placeholder="placeholder" v-model="searchTerm" @input="onInput"
                @focus="open = true" />
        </div>
        <div v-if="open && searchTerm.length > 2" class="max-h-[300px] overflow-y-auto z-50 options" @click.stop>
            <ul v-if="options.length > 0">
                <li v-for="opt in options" :key="opt.value" class="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    @click="selectOption(opt)">
                    {{ opt.label }}
                </li>
            </ul>
            <div v-else class="px-4 py-2 text-gray-500">
                Brak wyników
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Option {
    label: string;
    value: number | string;
}

const props = defineProps<{
    modelValue: any;
    options: Option[];
    placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue", "search"]);

const searchTerm = ref("");
const open = ref(false);
const root = ref<HTMLElement | null>(null);

// Obsługa kliknięcia poza dropdownem
const handleClickOutside = (event: MouseEvent) => {
    if (root.value && !root.value.contains(event.target as Node)) {
        open.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});

const onInput = () => {
    emit("search", searchTerm.value);
};

const selectOption = (opt: Option) => {
    emit("update:modelValue", opt.value);
    searchTerm.value = opt.label;
    open.value = false;
};

watch(
    () => props.modelValue,
    (newVal) => {
        const selected = props.options.find((o) => o.value === newVal);
        if (selected) {
            searchTerm.value = selected.label;
        }
    }
);
</script>

<style scoped>
.options {
    position: absolute;
    width: 100%;
    border: 1px solid #ccc;
    padding: 7px 0px;
    border-radius: 10px;
    background-color: white;
    overflow-y: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 100;
}


.serach-input {
    width: 100%;
    border-radius: 10px;
    border: 2px solid #dedede;
    padding: 12px 16px 12px 50px;
    transition: 0.25s all;
    outline: none;
    resize: none;
    margin-bottom: 4px !important;
}

.serach-input:focus {
    outline: none;
    border: 2px solid #31a9ce;
}

.serach-input::placeholder {
    color: #cacaca;
    font-family: 'Public Sans', sans-serif;
    font-size: 16px;
}
.serach-input::disabled {
  background: #cccccc !important;
}
</style>