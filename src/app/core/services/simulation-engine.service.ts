import { Injectable, inject } from '@angular/core';
import { NftablesParserService } from './nftables-parser.service';
import { SimulatedPacket, NftRule, NftChain, Verdict, NftTable } from '../models/nftables.model';
import { ROUTER_CONFIG, NETWORK_HOSTS } from '../data/topology.data';

export interface EvaluationResult {
  finalVerdict: Verdict;
  matchedRule: NftRule | null;
  chainEvaluated: string | null;
  logs: string[];
}

@Injectable({ providedIn: 'root' })
export class SimulationEngineService {
  private parser = inject(NftablesParserService);

  /** Enruta el paquete basándonos en nuestra topología IP de red (Fase 1 hardcoded rules) */
  private routePacket(packet: SimulatedPacket): { inIf: string | null, outIf: string | null, localTarget: boolean } {
    let inIf: string | null = null;
    let outIf: string | null = null;
    let isLocalTarget = false;

    // Determinar la interfaz de entrada (iifname)
    if (packet.sourceIp === 'internet') {
      inIf = 'eth0';
    } else {
      const srcHost = NETWORK_HOSTS.find(h => h.id === packet.sourceIp);
      if (srcHost) {
        if (srcHost.ip.startsWith('192.168.200')) inIf = 'eth1'; // DMZ
        if (srcHost.ip.startsWith('192.168.100')) inIf = 'eth2'; // LAN
      }
    }

    // Determinar destino (oifname o local)
    if (packet.destIp === 'internet') {
      outIf = 'eth0';
      isLocalTarget = false;
    } else if (packet.destIp === 'router') {
      isLocalTarget = true;
    } else {
      const dstHost = NETWORK_HOSTS.find(h => h.id === packet.destIp);
      if (dstHost) {
        if (dstHost.ip.startsWith('192.168.200')) outIf = 'eth1';
        if (dstHost.ip.startsWith('192.168.100')) outIf = 'eth2';
      }
    }

    return { inIf, outIf, localTarget: isLocalTarget };
  }

  /**
   * Ejecuta el paquete a través del sistema virtual de nftables
   */
  evaluatePacket(packet: SimulatedPacket): EvaluationResult {
    const routing = this.routePacket(packet);
    const tablesCounter = Array.from(this.parser.tables().values());
    const resultLogs: string[] = [];

    // Por simplificación en este simulador de filtrado, 
    // evaluaremos sólo las tablas filter (inet o ip)
    const filterTables = tablesCounter.filter(t => t.name === 'filter' && (t.family === 'inet' || t.family === 'ip'));

    // Si no hay tabla filter, por defecto Linux enruta (accept)
    if (filterTables.length === 0) {
      resultLogs.push(`No hay tabla 'filter' configurada. Acceso permitido (ACCEPT by default).`);
      return { finalVerdict: 'accept', matchedRule: null, chainEvaluated: null, logs: resultLogs };
    }

    // Buscamos cuál es el hook a evaluar según el routeo (INPUT vs FORWARD)
    const targetHook = routing.localTarget ? 'input' : 'forward';
    resultLogs.push(`Enrutamiento calculado -> In: ${routing.inIf}, Out: ${routing.outIf}. Validando Hook: [${targetHook.toUpperCase()}]`);

    // El paquete viaja por la cadena que tenga adherido ese hook
    for (const table of filterTables) {
      for (const [name, chain] of table.chains.entries()) {
        if (chain.hook === targetHook) {
          resultLogs.push(`Evaluando cadena '${chain.name}' (tabla ${table.family} ${table.name})...`);
          
          const evalResult = this.evaluateChain(chain, packet, routing);
          resultLogs.push(...evalResult.logs);
          
          if (evalResult.verdict !== 'continue') {
            return {
              finalVerdict: evalResult.verdict,
              matchedRule: evalResult.matchedRule,
              chainEvaluated: chain.name,
              logs: resultLogs
            };
          }
        }
      }
    }

    // Si llega aquí sin matching de reglas explícito, la política por defecto salva o tira el paquete.
    // Buscamos la política por defecto del hook evaluado.
    for (const table of filterTables) {
      for (const [name, chain] of table.chains.entries()) {
        if (chain.hook === targetHook) {
          resultLogs.push(`Sin match. Aplicando política por defecto de la cadena '${chain.name}': ${chain.policy.toUpperCase()}`);
          return {
            finalVerdict: chain.policy,
            matchedRule: null,
            chainEvaluated: chain.name,
            logs: resultLogs
          };
        }
      }
    }

    return { finalVerdict: 'accept', matchedRule: null, chainEvaluated: null, logs: resultLogs };
  }

  /**
   * Evalúa las reglas que contiene una cadena contra las meta-propiedades del paquete simulado
   */
  private evaluateChain(chain: NftChain, packet: SimulatedPacket, r: {inIf: string|null, outIf: string|null}): {verdict: Verdict, matchedRule: NftRule | null, logs: string[]} {
    const logs: string[] = [];

    // Validar el origen de IPs a nivel "string" contra el host si no es "internet"
    const srcHost = packet.sourceIp !== 'internet' ? NETWORK_HOSTS.find(h => h.id === packet.sourceIp) : null;
    const dstHost = packet.destIp !== 'internet' ? NETWORK_HOSTS.find(h => h.id === packet.destIp) : null;

    const realSrcIp = srcHost?.ip || '0.0.0.0';
    const realDstIp = dstHost?.ip || '0.0.0.0';

    for (const rule of chain.rules) {
      let isMatch = true;

      for (const cond of rule.conditions) {
        if (cond.field === 'iifname' && r.inIf !== cond.value) isMatch = false;
        if (cond.field === 'oifname' && r.outIf !== cond.value) isMatch = false;
        if (cond.field === 'ip saddr' && realSrcIp !== cond.value) isMatch = false; // Note: Aquí no resolvemos CIDR (ej 192.168.100.0/24) aún. A nivel básico exige IP exacta.
        if (cond.field === 'ip daddr' && realDstIp !== cond.value) isMatch = false;
        if (cond.field === 'tcp dport' && (packet.protocol !== 'tcp' || packet.destPort.toString() !== cond.value)) isMatch = false;
        if (cond.field === 'udp dport' && (packet.protocol !== 'udp' || packet.destPort.toString() !== cond.value)) isMatch = false;
        
        if (cond.field === 'ct state') {
          const validStates = Array.isArray(cond.value) ? cond.value : [cond.value];
          if (!validStates.includes(packet.connState)) isMatch = false;
        }

        if (!isMatch) break; // Optimization: First failed condition skips to next rule
      }

      if (isMatch) {
         logs.push(`✅ HIZO MATCH con regla ${rule.id}: ${rule.rawCommand} => ${rule.verdict.toUpperCase()}`);
         return { verdict: rule.verdict, matchedRule: rule, logs };
      }
    }

    return { verdict: 'continue', matchedRule: null, logs };
  }
}
