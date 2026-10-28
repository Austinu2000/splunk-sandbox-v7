export interface IdentityProbe {
  id: string;
  tick: number;
  host: string;
  sample: 'saml-reader' | 'ldap-reader';
  method: 'SAML' | 'LDAP';
  subject: string;
  configRevision: string;
  authenticated: boolean;
  roles: string[];
  indexes: { index: string; allowed: boolean; recordedEvents: number }[];
  capabilities: { indexes_edit: boolean; edit_roles: boolean; edit_monitor: boolean };
  error?: string;
}
export interface IdentityRuntime {
  version: 1;
  nextId: number;
  probes: IdentityProbe[];
}
