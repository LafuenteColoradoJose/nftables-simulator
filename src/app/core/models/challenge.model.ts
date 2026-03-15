import { Verdict, SimulatedPacket } from './nftables.model';

export type ChallengeDifficulty = 'Fácil' | 'Media' | 'Difícil';

export interface ChallengeValidation {
  packetParams: {
    sourceIp: string; // ID of the host, e.g., 'admin', 'empleado1', 'internet'
    destIp: string;   // ID of the host, e.g., 'router', 'apache', 'internet'
    protocol: 'tcp' | 'udp' | 'icmp';
    destPort: number;
    connState: 'new' | 'established' | 'related' | 'invalid';
  };
  expectedVerdict: Verdict;
  successMessage: string;
  errorMessage: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: ChallengeDifficulty;
  description: string;
  initialRules: string;
  validations: ChallengeValidation[];
}
