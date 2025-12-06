import { 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  OAuthProvider,
  type AuthProvider 
} from 'firebase/auth';

export type SocialProviderName = 'google' | 'github' | 'microsoft';

export interface AuthProviderConfig {
  id: string;
  name: string;
  create: () => AuthProvider;
  getCredentialFromError: (error: any) => any;
  getAccessToken?: (result: any) => string | undefined;
}

export const AUTH_PROVIDERS: Record<SocialProviderName | string, AuthProviderConfig> = {
  google: {
    id: 'google.com',
    name: 'Google',
    create: () => {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    },
    getCredentialFromError: (error) => GoogleAuthProvider.credentialFromError(error),
    getAccessToken: (result) => GoogleAuthProvider.credentialFromResult(result)?.accessToken || undefined,
  },
  'google.com': {
    id: 'google.com',
    name: 'Google',
    create: () => {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    },
    getCredentialFromError: (error) => GoogleAuthProvider.credentialFromError(error),
  },
  github: {
    id: 'github.com',
    name: 'GitHub',
    create: () => {
      const p = new GithubAuthProvider();
      p.addScope('user:email');
      return p;
    },
    getCredentialFromError: (error) => GithubAuthProvider.credentialFromError(error),
    getAccessToken: (result) => GithubAuthProvider.credentialFromResult(result)?.accessToken || undefined,
  },
  'github.com': {
    id: 'github.com',
    name: 'GitHub',
    create: () => {
      const p = new GithubAuthProvider();
      p.addScope('user:email');
      return p;
    },
    getCredentialFromError: (error) => GithubAuthProvider.credentialFromError(error),
  },
  microsoft: {
    id: 'microsoft.com',
    name: 'Microsoft',
    create: () => {
      const p = new OAuthProvider('microsoft.com');
      return p;
    },
    getCredentialFromError: (error) => OAuthProvider.credentialFromError(error),
    getAccessToken: (result) => OAuthProvider.credentialFromResult(result)?.accessToken || undefined,
  }
};

export const getAuthProvider = (name: string): AuthProviderConfig => {
  const config = AUTH_PROVIDERS[name] || AUTH_PROVIDERS['google']; // Fallback to Google
  return config;
};
