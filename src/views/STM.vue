<template>
  <RemoteEntryAdoc :url="url" :title="title" :description="description" />
</template>
<script setup>
import RemoteEntryAdoc from '@/components/RemoteEntryAdoc.vue'

const title = 'STM'
const description = 'Memoria Transaccional'
const url =
  'https://raw.githubusercontent.com/arquitecturas-concurrentes/iasc-stm-haskell-2019/master/01_semaphores_and_philosophers/README.adoc'
</script>
