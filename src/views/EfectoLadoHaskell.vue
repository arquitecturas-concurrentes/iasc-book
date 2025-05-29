<template>
  <RemoteEntryAdoc :url="url" :title="title" :description="description" />
</template>
<script setup>
import RemoteEntryAdoc from '@/components/RemoteEntryAdoc.vue'

const title = 'Efectos de Lado en Haskell'
const description = 'Una intro a memoria transaccional en Haskell'
const url =
  'https://raw.githubusercontent.com/arquitecturas-concurrentes/iasc-stm-haskell/refs/heads/master/00_side_effects/README.adoc'
</script>
