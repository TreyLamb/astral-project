import { Routes, Route } from 'react-router-dom';
import LeagueBuildEntry from './LeagueBuildEntry';
import LeagueBuildEditorRoute from './LeagueBuildEditor';
import LeagueBuildPip from './LeagueBuildPip';
import './LeagueBuild.css';

export default function LeagueBuildApp() {
  return (
    <Routes>
      <Route index element={<LeagueBuildEntry />} />
      <Route path="edit/:championId/:buildId" element={<LeagueBuildEditorRoute />} />
      <Route path="pip/:championId/:buildId" element={<LeagueBuildPip />} />
    </Routes>
  );
}
