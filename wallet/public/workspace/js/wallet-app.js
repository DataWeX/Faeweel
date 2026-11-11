"use strict";
const WalletApp = (() => {
    let windowElement = null;
    function open() {
        if (windowElement?.isConnected) {
            WM.focus(windowElement);
            return windowElement;
        }
        const element = WM.open('Wallet — Aether Vault', '', {
            width: 1180, height: 760,
            onClose: () => { windowElement = null; }
        });
        element.classList.add('wallet-window');
        const body = element.querySelector('.app-body');
        if (!body)
            throw new Error('Wallet window body is missing');
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
