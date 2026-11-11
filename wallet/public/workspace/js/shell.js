const Shell = (() => {
  const key = 'helixos.shell.v1';
  const profiles = Object.freeze([
    Object.freeze({ id: 'helix', label: 'Helix Classic' }),
    Object.freeze({ id: 'plasma', label: 'Plasma-inspired' }),
    Object.freeze({ id: 'xfce', label: 'XFCE-inspired' })
  ]);
  let current = 'helix';
  let persistent = true;

  function status() {
    return { profile: current, persistent };
  }

  function apply() {
    document.documentElement.dataset.shell = current;
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new CustomEvent('helix:shell', { detail: status() }));
  }

  function setProfile(profile) {
    if (!profiles.some(item => item.id === profile)) return { error: 'Unknown desktop profile' };
    current = profile;
    try {
      localStorage.setItem(key, current);
      persistent = true;
    } catch {
      persistent = false;
    }
    apply();
    return status();
  }

  try {
    const saved = localStorage.getItem(key);
    if (profiles.some(item => item.id === saved)) current = saved;
  } catch {
    persistent = false;
  }
  apply();
  return { profiles, status, setProfile };
})();
