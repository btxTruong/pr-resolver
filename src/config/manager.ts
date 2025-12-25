import Conf from 'conf';
import type { Config, Account } from '../types/index.js';

const DEFAULT_CONFIG: Config = {
  accounts: {},
  defaults: {
    showResolved: false,
  },
};

const config = new Conf<Config>({
  projectName: 'pr-resolver',
  defaults: DEFAULT_CONFIG,
});

export function getAccounts(): Record<string, Account> {
  return config.get('accounts');
}

export function getAccount(name: string): Account | undefined {
  const accounts = config.get('accounts');
  return accounts[name];
}

export function addAccount(name: string, token: string, orgs: string[] = []): void {
  config.set(`accounts.${name}`, { token, orgs });
}

export function removeAccount(name: string): boolean {
  if (!config.has(`accounts.${name}`)) {
    return false;
  }
  config.delete(`accounts.${name}` as keyof Config);
  return true;
}

export function getDefaultShowResolved(): boolean {
  return config.get('defaults.showResolved');
}

export function setDefaultShowResolved(value: boolean): void {
  config.set('defaults.showResolved', value);
}

export function findAccountForOrg(org: string): { name: string; account: Account } | null {
  const accounts = getAccounts();
  for (const [name, account] of Object.entries(accounts)) {
    if (account.orgs.includes(org)) {
      return { name, account };
    }
  }
  return null;
}

export function getFirstAccount(): { name: string; account: Account } | null {
  const accounts = getAccounts();
  const names = Object.keys(accounts);
  if (names.length === 0) {
    return null;
  }
  return { name: names[0], account: accounts[names[0]] };
}

export function getConfigPath(): string {
  return config.path;
}
