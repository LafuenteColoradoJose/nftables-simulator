import { Injectable, signal } from '@angular/core';
import {
  NftTable, NftChain, NftRule, NftFamily, NftHook,
  ChainType, Verdict, NftCondition
} from '../models/nftables.model';

export interface ParseResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class NftablesParserService {
  /** El estado maestro que almacena las tablas cacheadas en todo el simulador */
  readonly tables = signal<Map<string, NftTable>>(new Map());

  /**
   * Procesa el texto raw del editor y regenera el mapa de tablas, cadenas y reglas.
   */
  parseRuleset(rulesText: string): ParseResult {
    const tempTables = new Map<string, NftTable>();
    const errors: string[] = [];
    const warnings: string[] = [];
    let ruleId = 1;

    const lines = rulesText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i];
      let line = rawLine.trim();

      // Descartar comentarios
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx).trim();
      }

      if (!line) continue; // Línea vacía tras quitar comentarios

      // Manejar comandos concatenados por punto y coma es raro en esta app educativa, pero posible
      // Si la línea tiene "nft", lo limpiamos porque es azúcar sintáctico
      if (line.startsWith('nft ')) {
        line = line.substring(4).trim();
      }

      const tokens = line.split(/\s+/);
      const command = tokens[0];

      try {
        if (command === 'add' || command === 'insert') {
          const type = tokens[1];
          if (type === 'table') {
            this.parseAddTable(tokens, tempTables);
          } else if (type === 'chain') {
            this.parseAddChain(tokens, line, tempTables);
          } else if (type === 'rule') {
            this.parseAddRule(tokens, rawLine, tempTables, ruleId++);
          } else {
            warnings.push(`Línea ${i+1}: 'add ${type}' ignorado.`);
          }
        } else if (command === 'flush') {
          if (tokens[1] === 'ruleset') {
            tempTables.clear(); // Limpia todo
          } else {
            warnings.push(`Línea ${i+1}: Comando flush específico no fully soportado. Usa flush ruleset.`);
          }
        } else if (command === 'delete' || command === 'list') {
           warnings.push(`Línea ${i+1}: Operaciones de view/delete se ignoran en compilación completa.`);
        } else {
           warnings.push(`Línea ${i+1}: Sintaxis irreconocible iniciada con '${command}'.`);
        }
      } catch (err: any) {
        errors.push(`Línea ${i+1}: ${err.message}`);
      }
    }

    if (errors.length === 0) {
      this.tables.set(tempTables); // Sólo aplicar si no hubo crash en sintaxis
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Ej: nft add table inet filter
   */
  private parseAddTable(tokens: string[], tables: Map<string, NftTable>): void {
    if (tokens.length < 4) throw new Error('Declaración de tabla incompleta. Esperado: table [family] [name]');
    
    const family = tokens[2] as NftFamily;
    const name = tokens[3];
    const key = `${family}:${name}`;

    if (!tables.has(key)) {
      tables.set(key, { family, name, chains: new Map() });
    }
  }

  /**
   * Ej: nft add chain inet filter input { type filter hook input priority 0 ; policy drop ; }
   */
  private parseAddChain(tokens: string[], fullLine: string, tables: Map<string, NftTable>): void {
    if (tokens.length < 5) throw new Error('Declaración de cadena incompleta. Esperado: chain [family] [table] [chain_name]');

    const family = tokens[2] as NftFamily;
    const tableName = tokens[3];
    const chainName = tokens[4];
    const tKey = `${family}:${tableName}`;

    if (!tables.has(tKey)) {
      throw new Error(`Intentando crear cadena en la tabla inexistente '${tKey}'`);
    }

    const table = tables.get(tKey)!;

    // Buscar el bloque { ... }
    const blockStart = fullLine.indexOf('{');
    const blockEnd = fullLine.lastIndexOf('}');
    
    let type: ChainType = 'filter';
    let hook: NftHook | null = null;
    let priority = 0;
    let policy: Verdict = 'accept';

    if (blockStart !== -1 && blockEnd > blockStart) {
      const block = fullLine.substring(blockStart + 1, blockEnd);
      // Extraer parámetros como "type filter hook input priority 0; policy drop;"
      const blockTokens = block.split(/[\s;]+/).filter(t => t);
      
      for (let j = 0; j < blockTokens.length; j++) {
        if (blockTokens[j] === 'type' && blockTokens[j+1]) type = blockTokens[++j] as ChainType;
        if (blockTokens[j] === 'hook' && blockTokens[j+1]) hook = blockTokens[++j] as NftHook;
        if (blockTokens[j] === 'priority' && blockTokens[j+1]) priority = parseInt(blockTokens[++j], 10);
        if (blockTokens[j] === 'policy' && blockTokens[j+1]) policy = blockTokens[++j] as Verdict;
      }
    }

    if (!table.chains.has(chainName)) {
      table.chains.set(chainName, {
        name: chainName, table: tableName, family, type, hook, priority, policy, rules: []
      });
    }
  }

  /**
   * Ej: nft add rule inet filter input iifname eth2 tcp dport 22 ip saddr 192.168.100.50 accept
   */
  private parseAddRule(tokens: string[], rawLine: string, tables: Map<string, NftTable>, ruleId: number): void {
    if (tokens.length < 6) throw new Error('Declaración de regla incompleta.');

    const family = tokens[2] as NftFamily;
    const tableName = tokens[3];
    const chainName = tokens[4];
    const tKey = `${family}:${tableName}`;

    if (!tables.has(tKey)) throw new Error(`Tabla ${tKey} inexistente.`);
    const table = tables.get(tKey)!;
    
    if (!table.chains.has(chainName)) throw new Error(`Cadena ${chainName} inexistente en la tabla ${tKey}.`);
    const chain = table.chains.get(chainName)!;

    // Leer tokens a partir del índice 5: las condiciones
    let idx = 5;
    const conditions: NftCondition[] = [];
    let verdict: Verdict = 'accept'; // default (aunque sin verdict es continuar)

    while (idx < tokens.length) {
      const word = tokens[idx];
      
      // Chequear Veredictos
      if (['accept', 'drop', 'reject', 'return', 'continue'].includes(word)) {
        verdict = word as Verdict;
        idx++;
        continue;
      }

      // Chequear Campos
      if (word === 'iifname' || word === 'oifname') {
        conditions.push({ field: word, operator: 'eq', value: tokens[++idx] });
      } else if (word === 'ip' && tokens[idx+1] === 'saddr' || tokens[idx+1] === 'daddr') {
        const fieldName = `ip ${tokens[++idx]}`; // avanzamos uno para saltar 'saddr'
        conditions.push({ field: fieldName, operator: 'eq', value: tokens[++idx] });
      } else if ((word === 'tcp' || word === 'udp') && tokens[idx+1] === 'dport' || tokens[idx+1] === 'sport') {
        const fieldName = `${word} ${tokens[++idx]}`; // ej "tcp dport"
        conditions.push({ field: fieldName, operator: 'eq', value: tokens[++idx] });
      } else if (word === 'ct' && tokens[idx+1] === 'state') {
        // puede ser algo como "established,related"
        idx += 2; // saltar "ct", "state"
        const states = tokens[idx].split(',');
        conditions.push({ field: 'ct state', operator: 'eq', value: states.length > 1 ? states : states[0] });
      } else {
        // Ignoramos algo raro en este parser básico educativo, incrementamos índice.
      }
      idx++;
    }

    chain.rules.push({
      id: ruleId,
      rawCommand: rawLine.trim(),
      table: tableName,
      chain: chainName,
      conditions,
      verdict
    });
  }
}
