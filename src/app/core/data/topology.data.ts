import {
  NetworkTopology,
  NetworkHost,
  RouterConfig,
  NetworkSegment,
} from '../models/network.model';

/** Configuración del router Debian */
export const ROUTER_CONFIG: RouterConfig = {
  id: 'router',
  name: 'Router Firewall',
  os: 'Debian 12',
  description: 'Firewall perimetral con nftables. Conecta las tres zonas de la red.',
  interfaces: [
    { name: 'eth0', ip: 'ISP (DHCP)', zone: 'WAN', subnet: 'Internet' },
    { name: 'eth1', ip: '192.168.200.1', zone: 'DMZ', subnet: '192.168.200.0/24' },
    { name: 'eth2', ip: '192.168.100.1', zone: 'LAN', subnet: '192.168.100.0/24' },
  ],
};

/** Hosts de la red */
export const NETWORK_HOSTS: readonly NetworkHost[] = [
  {
    id: 'apache',
    name: 'Servidor Apache',
    ip: '192.168.200.2',
    zone: 'DMZ',
    icon: 'server',
    os: 'Debian 12 Server',
    services: [
      { name: 'HTTP', port: 80, protocol: 'tcp' },
      { name: 'HTTPS', port: 443, protocol: 'tcp' },
      { name: 'SSH', port: 22, protocol: 'tcp' },
    ],
    description: 'Servidor web en la zona DMZ. Expuesto a Internet.',
  },
  {
    id: 'admin',
    name: 'Admin PC',
    ip: '192.168.100.50',
    zone: 'LAN',
    icon: 'desktop',
    os: 'Ubuntu Desktop 24.04',
    services: [
      { name: 'SSH', port: 22, protocol: 'tcp' },
    ],
    description: 'Equipo del administrador del sistema. Acceso completo.',
  },
  {
    id: 'empleado1',
    name: 'Empleado 1',
    ip: '192.168.100.2',
    zone: 'LAN',
    icon: 'laptop',
    os: 'Ubuntu Desktop 24.04',
    services: [],
    description: 'Equipo de usuario estándar.',
  },
  {
    id: 'empleado2',
    name: 'Empleado 2',
    ip: '192.168.100.3',
    zone: 'LAN',
    icon: 'laptop',
    os: 'Ubuntu Desktop 24.04',
    services: [],
    description: 'Equipo de usuario estándar.',
  },
] as const;

/** Segmentos de red */
export const NETWORK_SEGMENTS: readonly NetworkSegment[] = [
  {
    zone: 'WAN',
    subnet: 'Internet',
    gateway: 'ISP',
    label: 'Internet (WAN)',
    color: '#f87171',
  },
  {
    zone: 'DMZ',
    subnet: '192.168.200.0/24',
    gateway: '192.168.200.1',
    label: 'DMZ',
    color: '#fbbf24',
  },
  {
    zone: 'LAN',
    subnet: '192.168.100.0/24',
    gateway: '192.168.100.1',
    label: 'LAN',
    color: '#34d399',
  },
] as const;

/** Topología completa */
export const NETWORK_TOPOLOGY: NetworkTopology = {
  router: ROUTER_CONFIG,
  hosts: NETWORK_HOSTS,
  networks: NETWORK_SEGMENTS,
};
