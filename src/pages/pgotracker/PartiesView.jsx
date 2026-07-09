import { useState } from 'react';

function MemberPicker({ accounts, onPick, onClose }) {
  return (
    <div className="pgo-party-picker-overlay" onClick={onClose}>
      <div className="pgo-party-picker" onClick={(e) => e.stopPropagation()}>
        <div className="pgo-party-picker-title">Add Member</div>
        {accounts.map((a) => (
          <button key={a.id} className="pgo-party-picker-item" onClick={() => onPick({ accountId: a.id })}>
            {a.name}
          </button>
        ))}
        <button className="pgo-party-picker-item guest" onClick={() => onPick({})}>
          + Guest
        </button>
      </div>
    </div>
  );
}

function PartyCard({ party, accounts, onAddMember, onRemoveMember, onRemoveParty, onRenameParty }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(party.name);

  function memberName(m) {
    if (m.guestLabel) return m.guestLabel;
    const acc = accounts.find((a) => a.id === m.accountId);
    return acc ? acc.name : '(removed account)';
  }

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed) onRenameParty(party.id, trimmed);
    setEditing(false);
  }

  return (
    <div className="pgo-party-card">
      <div className="pgo-party-card-header">
        {editing ? (
          <input
            className="pgo-party-name-input"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <span className="pgo-party-name" onClick={() => { setDraft(party.name); setEditing(true); }}>
            {party.name}
          </span>
        )}
        <button
          className="pgo-party-remove"
          onClick={() => onRemoveParty(party.id)}
          title="Delete group"
          aria-label={`Delete ${party.name}`}
        >
          ×
        </button>
      </div>

      <div className="pgo-party-members">
        {party.members.length === 0 ? (
          <div className="pgo-party-empty">No members yet</div>
        ) : (
          party.members.map((m) => (
            <div key={m.id} className="pgo-party-member-chip">
              <span>{memberName(m)}</span>
              <button onClick={() => onRemoveMember(party.id, m.id)} aria-label={`Remove ${memberName(m)}`}>
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <button className="pgo-party-add-member" onClick={() => setPickerOpen(true)}>
        + Add Member
      </button>

      {pickerOpen && (
        <MemberPicker
          accounts={accounts}
          onClose={() => setPickerOpen(false)}
          onPick={(member) => {
            onAddMember(party.id, member);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PartySection({ title, type, parties, accounts, onAddParty, onAddMember, onRemoveMember, onRemoveParty, onRenameParty }) {
  const filtered = parties.filter((p) => p.type === type);
  return (
    <div className="pgo-party-section">
      <div className="pgo-section-heading">
        <h2>{title}</h2>
      </div>
      <div className="pgo-party-grid">
        {filtered.map((p) => (
          <PartyCard
            key={p.id}
            party={p}
            accounts={accounts}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
            onRemoveParty={onRemoveParty}
            onRenameParty={onRenameParty}
          />
        ))}
      </div>
      <button className="pgo-party-add-group" onClick={() => onAddParty(type)}>
        + Add Group
      </button>
    </div>
  );
}

// No cap on group count or member count per group — "no limit" per explicit request.
// Guest numbering (Guest 1, Guest 2, ...) is handled entirely in the storage layer
// (pgoStorage.js / pgoFirestore.js's nextGuestLabel) so both backends stay identical;
// this component just picks {accountId} or {} (guest) and lets the caller resolve it.
export default function PartiesView({ parties, accounts, onAddParty, onRemoveParty, onRenameParty, onAddMember, onRemoveMember }) {
  return (
    <div>
      <PartySection
        title="Raid Parties"
        type="raid"
        parties={parties}
        accounts={accounts}
        onAddParty={onAddParty}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onRemoveParty={onRemoveParty}
        onRenameParty={onRenameParty}
      />
      <PartySection
        title="Gym Parties"
        type="gym"
        parties={parties}
        accounts={accounts}
        onAddParty={onAddParty}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onRemoveParty={onRemoveParty}
        onRenameParty={onRenameParty}
      />
    </div>
  );
}
