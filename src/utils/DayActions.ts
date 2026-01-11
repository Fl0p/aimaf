import { ChatAgent } from '../agents/ChatAgent';

export interface VoteAction {
  voterId: string;
  voterName: string;
  targetName: string;
}

export interface VoteResults {
  eliminated: ChatAgent | null;
  votes: Map<string, number>; // targetName -> vote count
  details: VoteAction[];
  tie: boolean;
  voteCount: number;
}

export class DayActions {
  private votes: VoteAction[] = [];

  addVote(action: VoteAction): void {
    // Remove previous vote from this voter if exists
    this.votes = this.votes.filter(v => v.voterId !== action.voterId);
    // Add new vote
    this.votes.push(action);
  }

  processVotes(agents: ChatAgent[]): VoteResults {
    const voteCounts = new Map<string, number>();
    
    // Count votes for each target
    this.votes.forEach(vote => {
      const count = voteCounts.get(vote.targetName) || 0;
      voteCounts.set(vote.targetName, count + 1);
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedName: string | null = null;
    let hasTie = false;

    voteCounts.forEach((count, name) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedName = name;
        hasTie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        hasTie = true;
      }
    });

    // If there's a tie, nobody is eliminated
    if (hasTie) {
      eliminatedName = null;
    }

    // Find the agent to eliminate
    const eliminated = eliminatedName 
      ? agents.find(a => a.name === eliminatedName && !a.isDead) || null
      : null;

    return {
      eliminated,
      votes: voteCounts,
      details: [...this.votes],
      tie: hasTie,
      voteCount: maxVotes,
    };
  }

  clear(): void {
    this.votes = [];
  }

  getVotes(): VoteAction[] {
    return [...this.votes];
  }
}
