// src/types/google.d.ts
export {}

declare global {
  interface Window {
    google: typeof google
  }

  namespace google.accounts.id {
    interface CredentialResponse {
      credential: string
      select_by: string
    }
  }

  namespace google {
    namespace accounts {
      namespace id {
        function initialize(config: {
          client_id: string
          callback: (response: google.accounts.id.CredentialResponse) => void
        }): void

        function renderButton(
          parent: HTMLElement,
          options: {
            theme: 'outline' | 'filled_blue' | 'filled_black'
            size: 'small' | 'medium' | 'large'
          }
        ): void

        function prompt(): void
      }
    }
  }
}
