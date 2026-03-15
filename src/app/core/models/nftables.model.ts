export type NftFamily = 'ip' | 'ip6' | 'inet' | 'arp' | 'bridge' | 'netdev';
export type NftHook = 'prerouting' | 'input' | 'forward' | 'output' | 'postrouting';
export type ChainType = 'filter' | 'nat' | 'route';
export type Verdict = 'accept' | 'drop' | 'reject' | 'return' | 'continue';

export interface NftTable {
  family: NftFamily;
  name: string;
  chains: Map<string, NftChain>;
}

export interface NftChain {
  name: string;
  table: string;
  family: NftFamily;
  type: ChainType;
  hook: NftHook | null; // Cadenas base tienen hook, las regulares no
  priority: number;
  policy: Verdict; // Por defecto accept, pero el usuario puede cambiar a drop/reject
  rules: NftRule[];
}

export interface NftRule {
  id: number;
  rawCommand: string; // Para mostrar en el log
  table: string;
  chain: string;
  conditions: NftCondition[]; // Ejemplo: iifname == eth0
  verdict: Verdict;
}

export interface NftCondition {
  field: string; // 'iifname', 'ip saddr', 'tcp dport', 'ct state', etc.
  operator: 'eq' | 'neq'; // == o != (implícito en la sínxtasis básica usualmente es eq)
  value: string | string[]; // El valor a comprobar (ej. 'eth0' o '192.168.100.0/24' o ['established', 'related'])
}

/** Modelo interno del paquete que se va a testear */
export interface SimulatedPacket {
  sourceIp: string;
  sourceInterface: string | null; // Calculada al entrar al router
  destIp: string;
  destInterface: string | null;   // Calculada durante el enrutamiento
  protocol: 'tcp' | 'udp' | 'icmp';
  destPort: number;
  connState: 'new' | 'established' | 'related' | 'invalid';
}
