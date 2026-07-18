// Export / import progress as JSON -- COULD #32. Lives in the app header
// (not inside either feature) since it backs up BOTH features' data for the
// active account in one file. Export never touches storage; import goes
// through MedalDexContext's importProgress action, which batches into a
// single storage/Firestore write per data kind (see medaldexStorage.js /
// medaldexFirestore.js's importAccountData) rather than one write per flag.
import { useRef, useState } from 'react';
import { useMedalDex } from './medaldexContext';

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ProgressBackup() {
  const { accounts, dex, medals, activeAccountId, actions } = useMedalDex();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState(null);

  if (!activeAccountId) return null;
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExport = () => {
    const payload = {
      format: 'medaldex-progress',
      version: 1,
      exportedAt: new Date().toISOString(),
      accountId: activeAccountId,
      accountName: activeAccount?.name || null,
      dex: dex[activeAccountId]?.species || {},
      medals: medals[activeAccountId]?.medals || {},
    };
    const safeName = (activeAccount?.name || 'account').replace(/[^a-z0-9-]+/gi, '_');
    download(`medaldex-${safeName}-${payload.exportedAt.slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
    flash('Exported progress JSON.');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const species = parsed?.dex && typeof parsed.dex === 'object' ? parsed.dex : null;
      const medalValues = parsed?.medals && typeof parsed.medals === 'object' ? parsed.medals : null;
      if (!species && !medalValues) {
        flash('That file has no recognizable dex/medals data.');
        return;
      }
      await actions.importProgress(activeAccountId, { species, medals: medalValues });
      const speciesCount = species ? Object.keys(species).length : 0;
      const medalCount = medalValues ? Object.keys(medalValues).length : 0;
      flash(`Imported ${speciesCount} species flag set(s) and ${medalCount} medal value(s) into ${activeAccount?.name || 'this account'}.`);
    } catch {
      flash('Could not read that file -- expected JSON exported from MedalDex.');
    }
  };

  return (
    <div className="mdx-backup">
      <button type="button" className="mdx-backup-btn" onClick={handleExport}>Export progress</button>
      <button type="button" className="mdx-backup-btn" onClick={handleImportClick}>Import progress</button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="mdx-backup-file-input"
        onChange={handleFileChange}
      />
      {message && <span className="mdx-backup-msg">{message}</span>}
    </div>
  );
}
