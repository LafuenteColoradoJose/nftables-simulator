/** Tipos de zona de red */
export type NetworkZone = 'WAN' | 'DMZ' | 'LAN';

/** Interfaz de red del router */
export interface NetworkInterface {
  readonly name: string;
  readonly ip: string;
  readonly zone: NetworkZone;
  readonly subnet: string;
}

/** Host de la red */
export interface NetworkHost {
  readonly id: string;
  readonly name: string;
  readonly ip: string;
  readonly zone: NetworkZone;
  readonly icon: HostIcon;
  readonly os: string;
  readonly services: readonly Service[];
  readonly description: string;
}

/** Servicios que puede tener un host */
export interface Service {
  readonly name: string;
  readonly port: number;
  readonly protocol: 'tcp' | 'udp';
}

/** Iconos disponibles para hosts */
export type HostIcon = 'router' | 'server' | 'desktop' | 'laptop';

/** Definición completa de la topología */
export interface NetworkTopology {
  readonly router: RouterConfig;
  readonly hosts: readonly NetworkHost[];
  readonly networks: readonly NetworkSegment[];
}

/** Configuración del router */
export interface RouterConfig {
  readonly id: string;
  readonly name: string;
  readonly os: string;
  readonly interfaces: readonly NetworkInterface[];
  readonly description: string;
}

/** Segmento de red */
export interface NetworkSegment {
  readonly zone: NetworkZone;
  readonly subnet: string;
  readonly gateway: string;
  readonly label: string;
  readonly color: string;
}
