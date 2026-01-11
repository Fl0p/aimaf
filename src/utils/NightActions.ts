import { ChatAgent } from '../agents/ChatAgent';

export interface NightAction {
  agentId: string;
  agentName: string;
  actionType: 'kill' | 'check' | 'save';
  targetName: string;
}

export class NightActions {
  private actions: NightAction[] = [];

  addAction(action: NightAction): void {
    this.actions.push(action);
  }

  getActions(): NightAction[] {
    return [...this.actions];
  }

  clear(): void {
    this.actions = [];
  }

  // Process all night actions and return results
  processActions(agents: ChatAgent[]): {
    killed: ChatAgent | null;
    checks: Array<{ detective: ChatAgent; target: ChatAgent; isMafia: boolean }>;
    saved: ChatAgent | null;
  } {
    const killActions = this.actions.filter(a => a.actionType === 'kill');
    const checkActions = this.actions.filter(a => a.actionType === 'check');
    const saveActions = this.actions.filter(a => a.actionType === 'save');

    // Determine who to kill (majority vote or last action)
    let killedAgent: ChatAgent | null = null;
    if (killActions.length > 0) {
      // Count votes for each target
      const votes = new Map<string, number>();
      killActions.forEach(action => {
        votes.set(action.targetName, (votes.get(action.targetName) || 0) + 1);
      });

      // Find target with most votes
      let maxVotes = 0;
      let targetName = '';
      votes.forEach((count, name) => {
        if (count > maxVotes) {
          maxVotes = count;
          targetName = name;
        }
      });

      killedAgent = agents.find(a => a.name === targetName) || null;
    }

    // Determine who to save
    let savedAgent: ChatAgent | null = null;
    if (saveActions.length > 0) {
      // Take the last save action
      const lastSave = saveActions[saveActions.length - 1];
      savedAgent = agents.find(a => a.name === lastSave.targetName) || null;
    }

    // If killed agent is saved, cancel the kill
    if (killedAgent && savedAgent && killedAgent.id === savedAgent.id) {
      killedAgent = null;
    } else if (savedAgent) {
      savedAgent = null;
    }

    // Process checks
    const checks = checkActions
      .map(action => {
        const detective = agents.find(a => a.id === action.agentId);
        const target = agents.find(a => a.name === action.targetName);
        if (detective && target) {
          return {
            detective,
            target,
            isMafia: target.mafiaRole === 'mafia', // don't check for don's role
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ detective: ChatAgent; target: ChatAgent; isMafia: boolean }>;

    return {
      killed: killedAgent,
      checks,
      saved: savedAgent,
    };
  }
}
