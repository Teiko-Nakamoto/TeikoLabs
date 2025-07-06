import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { stacksTestnet } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function connectWallet(onFinish) {
  showConnect({
    userSession,
    appDetails: {
      name: 'The Solution DEX',
      icon: 'https://yourdomain.com/logo.png',
    },
    network: stacksTestnet,
    onFinish,
    onCancel: () => console.log('User canceled wallet connection'),
  });
}

export function getUserSession() {
  return userSession;
}

export function disconnectWallet() {
  if (userSession.isUserSignedIn()) {
    userSession.signUserOut();
  }
}
