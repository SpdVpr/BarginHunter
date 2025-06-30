import type { AppProps } from 'next/app';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import '../src/styles/globals.css';
import '../src/App.css';

// Basic i18n configuration
const i18n = {
  Polaris: {
    Avatar: {
      label: 'Avatar',
      labelWithInitials: 'Avatar with initials {initials}',
    },
    ContextualSaveBar: {
      save: 'Save',
      discard: 'Discard',
    },
    TextField: {
      characterCount: '{count} characters',
    },
    TopBar: {
      toggleMenuLabel: 'Toggle menu',
      SearchField: {
        clearButtonLabel: 'Clear',
        search: 'Search',
      },
    },
    Modal: {
      iFrameTitle: 'body markup',
    },
    Frame: {
      skipToContent: 'Skip to content',
      navigationLabel: 'Navigation',
      Navigation: {
        closeMobileNavigationLabel: 'Close navigation',
      },
    },
  },
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProvider i18n={i18n}>
      <Component {...pageProps} />
    </AppProvider>
  );
}

export default MyApp;
