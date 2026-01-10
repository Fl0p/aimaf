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

export function formatPlayersList(agents: ChatAgent[]): string {
  if (agents.length === 0) {
    return 'No players in the game yet.';
  }
  
  const allNames = agents.map(agent => `@${agent.name}`).join(', ');
  return `${agents.length} players:\n${allNames}`;
}

export function formatGameStatus(agents: ChatAgent[]): string {
  if (agents.length === 0) {
    return 'No players in the game yet.';
  }

  const status = getGameStatus(agents);
  const lines: string[] = [];
  
  // Alive in the game (count by role)
  if (status.alive > 0) {
    const roleStrings: string[] = [];
    if (status.aliveMafia > 0) roleStrings.push(`${MafiaRole.Mafia}: ${status.aliveMafia}`);
    if (status.aliveCivilians > 0) roleStrings.push(`${MafiaRole.Civilian}: ${status.aliveCivilians}`);
    lines.push(`Alive in the game: ${roleStrings.join(', ')}`);
  } else {
    lines.push('Alive in the game: none');
  }
  
  // Dead list (names and roles)
  const deadAgents = agents.filter(agent => agent.isDead);
  if (deadAgents.length > 0) {
    const deadList = deadAgents.map(agent => `@${agent.name} - ${agent.mafiaRole}`).join(', ');
    lines.push(`Dead list: ${deadList}`);
  } else {
    lines.push('Dead list: none');
  }

  return lines.join('\n');
}
