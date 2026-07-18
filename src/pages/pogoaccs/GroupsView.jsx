import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { PgoStorage } from '../pgotracker/pgoStorage';
import { PgoFirestore } from '../pgotracker/pgoFirestore';
import { usePogoAccs } from './pogoaccsContext';

export default function GroupsView() {
  const { accounts, groups, signedIn, loading, actions } = usePogoAccs();
  const { user } = useAuth();

  const [newGroupName, setNewGroupName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [parties, setParties] = useState([]);
  const [partiesLoading, setPartiesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadParties() {
      setPartiesLoading(true);
      const loaded = signedIn ? await PgoFirestore.getParties(user.uid) : PgoStorage.getParties();
      if (!cancelled) setParties(loaded);
      if (!cancelled) setPartiesLoading(false);
    }
    loadParties();
    return () => { cancelled = true; };
  }, [signedIn, user]);

  if (loading) {
    return <div className="pgoa-panel pgoa-loading">Loading…</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="pgoa-panel pgoa-empty">
        No accounts yet — create them in <Link className="pgoa-link" to="/pgo-tracker">PGO Tracker</Link>.
      </div>
    );
  }

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    actions.addGroup(name);
    setNewGroupName('');
  };

  const startRename = (group) => {
    setRenamingId(group.id);
    setRenameValue(group.name);
  };

  const saveRename = () => {
    const name = renameValue.trim();
    if (name) actions.renameGroup(renamingId, name);
    setRenamingId(null);
  };

  const toggleMember = (group, accountId) => {
    const current = group.memberAccountIds || [];
    const next = current.includes(accountId)
      ? current.filter((id) => id !== accountId)
      : [...current, accountId];
    actions.setGroupMembers(group.id, next);
  };

  const importParty = async (party) => {
    const memberAccountIds = party.members.filter((m) => m.accountId).map((m) => m.accountId);
    const group = await actions.addGroup(party.name);
    if (group) actions.setGroupMembers(group.id, memberAccountIds);
  };

  return (
    <div className="pgoa-panel pgoa-panel-accent">
      <div className="pgoa-section-label">Groups</div>

      <div className="pgoa-quickadd" style={{ margin: '0 0 1.5rem' }}>
        <input
          className="pgoa-input"
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createGroup()}
          style={{ width: '100%', maxWidth: '20rem' }}
        />{' '}
        <button className="pgoa-btn pgoa-btn-primary" onClick={createGroup}>Create</button>
      </div>

      {groups.length === 0 ? (
        <div className="pgoa-empty">No groups yet — create one above.</div>
      ) : (
        <div className="pgoa-cards">
          {groups.map((group) => (
            <div key={group.id} className="pgoa-account-card">
              <div className="pgoa-group-header">
                {renamingId === group.id ? (
                  <>
                    <input
                      className="pgoa-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                      autoFocus
                    />
                    <div className="pgoa-group-actions">
                      <button className="pgoa-btn pgoa-btn-primary" onClick={saveRename}>Save</button>
                      <button className="pgoa-btn" onClick={() => setRenamingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="pgoa-card-title">{group.name}</h3>
                    <div className="pgoa-group-actions">
                      <button className="pgoa-btn" onClick={() => startRename(group)}>Rename</button>
                      <button className="pgoa-btn" onClick={() => actions.removeGroup(group.id)}>Remove group</button>
                    </div>
                  </>
                )}
              </div>

              <span className="pgoa-badge">{(group.memberAccountIds || []).length} member{(group.memberAccountIds || []).length === 1 ? '' : 's'}</span>

              <div className="pgoa-member-list">
                {accounts.map((account) => (
                  <label key={account.id} className="pgoa-member-item">
                    <input
                      type="checkbox"
                      checked={(group.memberAccountIds || []).includes(account.id)}
                      onChange={() => toggleMember(group, account.id)}
                    />
                    {account.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pgoa-divider" />

      <div className="pgoa-section-label">Import from PGO Tracker</div>
      {partiesLoading ? (
        <div className="pgoa-empty">Loading…</div>
      ) : parties.length === 0 ? (
        <div className="pgoa-empty">No PGO Tracker parties yet.</div>
      ) : (
        <div className="pgoa-import-list">
          {parties.map((party) => (
            <div key={party.id} className="pgoa-import-row">
              <span>{party.name}</span>
              <button className="pgoa-btn" onClick={() => importParty(party)}>Import</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
