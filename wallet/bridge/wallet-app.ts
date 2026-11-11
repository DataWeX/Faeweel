declare const WM: {
  open(title: string, body: string, options: { width: number; height: number; onClose: () => void }): HTMLElement;
  focus(window: HTMLElement): void;
};

const WalletApp = (() => {
  let windowElement: HTMLElement | null = null;

  function open(): HTMLElement {
    if (windowElement?.isConnected) {
      WM.focus(windowElement);
      return windowElement;
    }
    const element = WM.open('Wallet — Aether Vault', '', {
      width: 1180, height: 760,
      onClose: () => { windowElement = null; }
    });
    element.classList.add('wallet-window');
    const body = element.querySelector<HTMLElement>('.app-body');
    if (!body) throw new Error('Wallet window body is missing');
    const frame = document.createElement('iframe');
    frame.className = 'wallet-frame';
    frame.title = 'Aether Vault — in-house wallet simulation';
    frame.src = '/vault.html';
    body.appendChild(frame);
    windowElement = element;
    return element;
  }

  return { open };
})();
