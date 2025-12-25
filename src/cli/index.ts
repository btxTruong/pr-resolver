import { Command } from 'commander';
import { createAuthCommand } from './auth.js';

const program = new Command();

program
  .name('pr-resolver')
  .description('CLI to view and resolve GitHub PR comments')
  .version('0.1.0');

program.addCommand(createAuthCommand());

program.parse();
