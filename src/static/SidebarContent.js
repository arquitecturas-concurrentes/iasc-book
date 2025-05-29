import Separator from '@/components/Separator.vue'

const separator = Separator

export const sidearContent = [
  {
    header: 'IASC Book',
    hiddenOnCollapse: true,
  },
  {
    href: '/tema/introduccion',
    title: 'Introduccion',
    icon: 'fa fa-book',
  },
  {
    href: '/tema/concurrencia_paralelismo',
    title: 'Concurrencia y Paralelismo',
    icon: 'fa fa-book',
  },
  {
    component: Separator,
  },
  {
    href: '/tema/cps',
    title: 'CPS',
    icon: 'fa fa-book',
  },
  {
    href: '/tema/event_loop',
    title: 'Event Loop',
    icon: 'fa fa-book',
  },
  {
    href: '/tema/promises',
    title: 'Promises',
    icon: 'fa fa-book',
  },
  {
    href: '#',
    title: 'Planificacion Cooperativa',
    icon: 'fa fa-chevron-down',
    child: [
      {
        href: '/tema/corutinas',
        title: 'Corutinas',
      },
      {
        href: '/tema/fibers',
        title: 'Fibers',
      },
      {
        href: '/tema/guilds',
        title: 'Guilds',
      },
    ],
  },
  {
    href: '/tema/estructuras_funcionales',
    title: 'Estructuras Funcionales',
    icon: 'fa fa-book',
  },
  {
    href: '#act',
    title: 'Actores',
    icon: 'fa fa-chevron-down',
    child: [
      {
        href: '/tema/actores_intro',
        title: 'Introduccion a Actores',
      },
      {
        href: '/tema/otp',
        title: 'Elixir/Erlang OTP',
      },
    ],
  },
  {
    href: '#stm',
    title: 'Memoria Transaccional',
    icon: 'fa fa-chevron-down',
    child: [
      {
        href: '/tema/efecto_lado_haskell',
        title: 'Efectos de Lado en Haskell',
      },
      {
        href: '/tema/stm',
        title: 'Memorial Transaccional',
      },
    ],
  },
  {
    component: separator,
  },
  {
    header: 'Arquitectura y Distribucion',
    hiddenOnCollapse: true,
  },
  {
    href: '#dist',
    title: 'Distribucion',
    icon: 'fa fa-chevron-down',
    child: [
      {
        href: '/tema/distribucion',
        title: 'Introduccion a Distribucion',
      },
      {
        href: '/tema/interleaving',
        title: 'Interleaving y Netsplits',
      },
      {
        href: '/tema/cap',
        title: 'Notas sobre CAP',
      },
      {
        href: '/tema/mitos_distribucion',
        title: 'Mitos en la distribucion',
      },
    ],
  },
  {
    href: '#cont',
    title: 'Contenedores',
    icon: 'fa fa-chevron-down',
    child: [
      {
        href: '/tema/intro_contenedores',
        title: 'Intro a Contenedores',
      },
      {
        href: '/tema/service_mesh',
        title: 'Service Mesh',
      },
    ],
  },
]
