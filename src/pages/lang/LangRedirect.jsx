import { Navigate, useParams } from 'react-router-dom';

// The lang tool was renamed to Vocab Vault (/vocab-vault) — this keeps any
// old /lang/... links or bookmarks working by forwarding to the new path.
export default function LangRedirect() {
  const { '*': splat } = useParams();
  return <Navigate to={`/vocab-vault${splat ? `/${splat}` : ''}`} replace />;
}
