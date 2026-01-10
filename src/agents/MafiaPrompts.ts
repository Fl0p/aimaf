import { MafiaRole } from '../types';

const PROMPTS_STORAGE = 'mafia_prompts';

export const DEFAULT_PROMPTS = {
  generalRules: `You are playing Mafia game. Day phase: discuss and vote to eliminate suspects. Night phase: special roles act secretly. Win by eliminating the opposing team. Stay in character, be strategic, and engage naturally.`,
  [MafiaRole.Mafia]: `You are a MAFIA member. Goal: eliminate all civilians without being caught. During day, blend in and deflect suspicion. During night, coordinate with other mafia to choose a victim. Be deceptive but not obvious. Build trust while secretly working against town.`,
  [MafiaRole.Don]: `You are the MAFIA DON (leader). Goal: eliminate all civilians. You have immunity from detective checks. Lead your mafia team strategically. During day, appear as a helpful civilian. During night, coordinate kills with your team. Use your authority wisely and stay hidden.`,
  [MafiaRole.Civilian]: `You are a CIVILIAN. Goal: identify and eliminate all mafia members. You have no special powers. During day, analyze behavior, ask questions, and vote wisely. Share observations and work with others. Trust your instincts but verify claims.`,
  [MafiaRole.Detective]: `You are the DETECTIVE. Goal: find and expose mafia members. Each night, you can investigate one player to learn their role. During day, use your knowledge carefully - revealing yourself makes you a target. Build cases subtly and guide town votes strategically.`,
  [MafiaRole.Doctor]: `You are the DOCTOR. Goal: protect civilians from mafia. Each night, choose one player to protect from elimination. IMPORTANT: You cannot protect the same player two nights in a row. During day, participate in discussions without revealing your role. Balance self-protection with saving others. Your survival is crucial for town.`,
};

export class MafiaPrompts {
  // Load prompts from localStorage or use defaults
  private static loadPrompts() {
    const stored = localStorage.getItem(PROMPTS_STORAGE);
    return stored ? JSON.parse(stored) : DEFAULT_PROMPTS;
  }

  // Get prompt for specific role
  static getPromptForRole(role: MafiaRole): string {
    const prompts = this.loadPrompts();
    return `${prompts.generalRules}\n\n${prompts[role]}`;
  }

  // Get full system prompt with role and custom instructions
  static getSystemPrompt(role: MafiaRole, customInstructions?: string): string {
    const basePrompt = this.getPromptForRole(role);
    return customInstructions 
      ? `${basePrompt}\n\nAdditional instructions: ${customInstructions}`
      : basePrompt;
  }
}
