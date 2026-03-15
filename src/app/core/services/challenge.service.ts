import { Injectable, signal, inject } from '@angular/core';
import { Challenge, ChallengeValidation } from '../models/challenge.model';
import { SimulationEngineService } from './simulation-engine.service';
import { SimulatedPacket, Verdict } from '../models/nftables.model';
import { NftablesParserService } from './nftables-parser.service';

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private engine = inject(SimulationEngineService);
  private parser = inject(NftablesParserService);

  readonly challenges = signal<Challenge[]>([
    {
       id: 'reto-01',
       title: 'Reto 1: Proteger el Router (SSH por admin)',
       difficulty: 'Fácil',
       description: 'Por defecto, el router está bloqueando todo el tráfico entrante. Escribe una regla en la cadena `input` de la tabla `filter` para permitir el acceso SSH (TCP puerto 22) únicamente desde el PC del Administrador (192.168.100.50).',
       initialRules: '# Reto 1\nnft add table inet filter\nnft add chain inet filter input { type filter hook input priority 0 ; policy drop ; }\n\n# Tu regla va aquí debajo:\n\n',
       validations: [
         {
           packetParams: { sourceIp: 'admin', destIp: 'router', protocol: 'tcp', destPort: 22, connState: 'new' },
           expectedVerdict: 'accept',
           successMessage: 'El PC Admin pudo hacer SSH al Router.',
           errorMessage: 'El PC Admin fue bloqueado o no matcheó regla.'
         },
         {
           packetParams: { sourceIp: 'empleado1', destIp: 'router', protocol: 'tcp', destPort: 22, connState: 'new' },
           expectedVerdict: 'drop',
           successMessage: 'Se bloqueó a Empleado 1 correctamente.',
           errorMessage: 'Empleado 1 logró conectarse (o fue REJECT, se esperaba DROP por política).'
         }
       ]
    },
    {
       id: 'reto-02',
       title: 'Reto 2: Acceso Web Público a la DMZ',
       difficulty: 'Media',
       description: 'La política es restrictiva por defecto. Permite que desde Internet puedan acceder al servidor web Apache (192.168.200.2) simulado en la DMZ, usando HTTP (TCP puerto 80). El resto del tráfico de internet debe ser bloqueado por defecto.',
       initialRules: '# Reto 2\nnft add table inet filter\nnft add chain inet filter forward { type filter hook forward priority 0 ; policy drop ; }\n\n# Escribe aquí tu regla:\n\n',
       validations: [
         {
           packetParams: { sourceIp: 'internet', destIp: 'apache', protocol: 'tcp', destPort: 80, connState: 'new' },
           expectedVerdict: 'accept',
           successMessage: 'El Servidor Web es accesible desde Internet.',
           errorMessage: 'Internet no tiene acceso al Servidor Web, o falta la tabla/chain.'
         },
         {
           packetParams: { sourceIp: 'internet', destIp: 'apache', protocol: 'tcp', destPort: 22, connState: 'new' },
           expectedVerdict: 'drop',
           successMessage: 'Los atacantes de internet no pueden acceder por SSH al Apache.',
           errorMessage: 'SSH expuesto a internet. Asegúrate de especificar solo el puerto 80.'
         }
       ]
    }
  ]);

  readonly activeChallenge = signal<Challenge | null>(null);

  setActiveChallenge(id: string | null) {
      if (!id) {
          this.activeChallenge.set(null);
          return;
      }
      const challenge = this.challenges().find(c => c.id === id);
      this.activeChallenge.set(challenge || null);
  }

  /**
   * Valida el reto activo contra el estado actual parseado del firewall virtual.
   */
  evaluateChallenge(): { passed: boolean; results: { message: string; ok: boolean }[] } {
      const challenge = this.activeChallenge();
      if (!challenge) return { passed: false, results: [] };

      const results = challenge.validations.map((val: ChallengeValidation) => {
          const simPacket: SimulatedPacket = {
              sourceIp: val.packetParams.sourceIp,
              sourceInterface: null,
              destIp: val.packetParams.destIp,
              destInterface: null,
              protocol: val.packetParams.protocol,
              destPort: val.packetParams.destPort,
              connState: val.packetParams.connState
          };
          
          const evalResult = this.engine.evaluatePacket(simPacket);
          const ok = evalResult.finalVerdict === val.expectedVerdict;

          return {
             message: ok ? val.successMessage : val.errorMessage,
             ok
          };
      });

      const passed = results.every(r => r.ok);
      return { passed, results };
  }
}
