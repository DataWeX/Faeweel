export default function VaultOperator() {
  return <section>
    <div className="kicker">Operator · disconnected</div>
    <h1 className="title">The vault, <i>under lock.</i></h1>
    <p className="lead">The original in-house wallet interface is restored. Its legacy server-side signer is not connected to this desktop.</p>
    <div className="folio">
      <h3>Passkey &amp; vault signer</h3>
      <p className="mute">Enrollment, unlocking, identity seals and signing are unavailable here. HelixOS guest/root accounts do not authorize wallet operations.</p>
      <div className="row">
        <button className="btn" type="button" disabled>Enroll passkey</button>
        <button className="btn primary" type="button" disabled>Unlock vault</button>
      </div>
      <p className="hint">No private keys, recovery phrases or PINs are requested. Do not use this development integration to hold real funds.</p>
    </div>
  </section>
}
