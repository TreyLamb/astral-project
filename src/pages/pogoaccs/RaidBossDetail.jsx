import { useParams } from 'react-router-dom';

export default function RaidBossDetail() {
  const { bossId } = useParams();

  return (
    <div className="pgoa-panel">
      <div className="pgoa-section-label">Raid Boss: {bossId}</div>
      <p>Raid boss detail — coming online…</p>
    </div>
  );
}
