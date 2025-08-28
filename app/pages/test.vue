<template>
    <div class="wrapper">
        <div class="tooltip-container">
            Najedź na mnie
            <div class="tooltip">Jestem tooltipem 🚀</div>
        </div>
    </div>
</template>

<script setup lang="ts">
// nic w JS nie trzeba
</script>

<style scoped>
.wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.tooltip-container {
    position: relative;
    display: inline-block;
    background: #3490dc;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
}

/* tooltip zawsze istnieje, ale jest niewidoczny przez opacity */
.tooltip {
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    /* zawsze biały */
    padding: 6px 10px;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    /* żeby nie przeszkadzał */
    transition: opacity 0.3s ease-in-out;
    z-index: 10;
}

/* strzałka */
.tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
}

/* pokazanie tooltipa */
.tooltip-container:hover .tooltip {
    opacity: 1;
}
</style>