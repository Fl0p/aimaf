import { ChatAgent } from '../agents/ChatAgent';
import { MafiaRole } from '../types';

export interface GameStatus {
  total: number;
  alive: number;
  dead: number;
  mafia: number;
  civilians: number;
  detectives: number;
  doctors: number;
  dons: number;
  aliveMafia: number;
  aliveCivilians: number;
}

export function getGameStatus(agents: ChatAgent[]): GameStatus {
  const status: GameStatus = {
    total: agents.length,
    alive: 0,
    dead: 0,
    mafia: 0,
    civilians: 0,
    detectives: 0,
    doctors: 0,
    dons: 0,
    aliveMafia: 0,
    aliveCivilians: 0,
  };

  agents.forEach((agent) => {
    // Count alive/dead
    if (agent.isDead) {
      status.dead++;
    } else {
      status.alive++;
    }

    // Count by role
    switch (agent.mafiaRole) {
      case MafiaRole.Mafia:
        status.mafia++;
        if (!agent.isDead) status.aliveMafia++;
        break;
      case MafiaRole.Civilian:
        status.civilians++;
        if (!agent.isDead) status.aliveCivilians++;
        break;
      case MafiaRole.Detective:
        status.detectives++;
        if (!agent.isDead) status.aliveCivilians++;
        break;
      case MafiaRole.Doctor:
        status.doctors++;
        if (!agent.isDead) status.aliveCivilians++;
        break;
      case MafiaRole.Don:
        status.dons++;
        if (!agent.isDead) status.aliveMafia++;
        break;
    }
  });

  return status;
}

export function formatGameStatus(agents: ChatAgent[]): string {
  const status = getGameStatus(agents);

  if (status.total === 0) {
    return 'No players in the game yet.';
  }

  const totalLine = `Total players: ${status.total} (alive: ${status.alive}, dead: ${status.dead})`;
  
  const roleParts: string[] = [];
  roleParts.push(`Mafia: ${status.mafia} (alive: ${status.aliveMafia})`);
  roleParts.push(`Civilians: ${status.civilians} (alive: ${status.aliveCivilians})`);
  
  if (status.detectives > 0) {
    roleParts.push(`Detectives: ${status.detectives}`);
  }

  if (status.doctors > 0) {
    roleParts.push(`Doctors: ${status.doctors}`);
  }

  if (status.dons > 0) {
    roleParts.push(`Dons: ${status.dons}`);
  }

  const roleLine = `By Role: ${roleParts.join(', ')}`;

  const lines = [totalLine, roleLine];

  // Check win conditions
  if (status.aliveMafia === 0 && status.alive > 0) {
    lines.push('Civilians win!');
  } else if (status.aliveMafia >= status.aliveCivilians && status.alive > 0) {
    lines.push('Mafia wins!');
  }

  return lines.join('\n');
}
