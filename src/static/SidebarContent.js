import Separator from '@/components/Separator.vue'

const separator = Separator

export const sidearContent = [
    {
        header: true,
        title: 'IASC Book',
        hiddenOnCollapse: true
    },
    {
        href: '/introduccion',
        title: 'Introduccion',
        icon: 'fa fa-book'
    },
    {
        href: '/concurrencia_paralelismo',
        title: 'Concurrencia y Paralelismo',
        icon: 'fa fa-book'
    },
    {
        component: Separator
    },
    {
        href: '/cps',
        title: 'CPS',
        icon: 'fa fa-book'
    }, {
        href: '/event_loop',
        title: 'Event Loop',
        icon: 'fa fa-book'
    }, {
        href: '/promises',
        title: 'Promises',
        icon: 'fa fa-book'
    },
    {
        href: '#',
        title: 'Planificacion Cooperativa',
        icon: 'fa fa-chevron-down',
        child: [
            {
                href: '/corutinas',
                title: 'Corutinas'
            },
            {
                href: '/fibers',
                title: 'Fibers'
            },
            {
                href: '/guilds',
                title: 'Guilds'
            }
        ]
    },
    {
        href: '/estructuras_funcionales',
        title: 'Estructuras Funcionales',
        icon: 'fa fa-book'
    },
    {
        href: '#act',
        title: 'Actores',
        icon: 'fa fa-chevron-down',
        child: [
            {
                href: '/actores_intro',
                title: 'Introduccion a Actores'
            },
            {
                href: '/otp',
                title: 'Elixir/Erlang OTP'
            }
        ]
    },
    {
        href: '#stm',
        title: 'Memoria Transaccional',
        icon: 'fa fa-chevron-down',
        child: [
            {
                href: '/efecto_lado_haskell',
                title: 'Efectos de Lado en Haskell'
            },
            {
                href: '/stm',
                title: 'Memorial Transaccional'
            }
        ]
    },
    {
        component: separator
    },
    {
        header: true,
        title: 'Arquitectura y Distribucion',
        hiddenOnCollapse: true
    },
    {
        href: '#dist',
        title: 'Distribucion',
        icon: 'fa fa-chevron-down',
        child: [
            {
                href: '/distribucion',
                title: 'Introduccion a Distribucion'
            },
            {
                href: '/interleaving',
                title: 'Interleaving y Netsplits'
            },
            {
                href: '/cap',
                title: 'Notas sobre CAP'
            },
            {
                href: '/mitos_distribucion',
                title: 'Mitos en la distribucion'
            }
        ]
    },
    {
        href: '#cont',
        title: 'Contenedores',
        icon: 'fa fa-chevron-down',
        child: [
            {
                href: '/intro_contenedores',
                title: 'Intro a Contenedores'
            },
            {
                href: '/service_mesh',
                title: 'Service Mesh'
            }
        ]
    },
]
