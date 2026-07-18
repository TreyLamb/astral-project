// Official Artwork sprite -- requirement #2. Shared by DexView (grid cards),
// SpeciesDetail (header), Summary ("what to hunt" chips), and FormsView.
// Single source of truth for the URL pattern + the 404 fallback so all four
// call sites degrade identically if PokeAPI's mirror is missing an entry
// (unreleased/very new dex numbers, transient network failure, etc.).
import { useState } from 'react';
import { officialArtworkUrl } from './medaldexConfig';

export default function Sprite({ dex, name, className = '', size }) {
  const [errored, setErrored] = useState(false);
  const style = size ? { width: size, height: size } : undefined;

  if (!dex || errored) {
    return (
      <div className={`mdx-sprite mdx-sprite-fallback ${className}`} style={style} aria-hidden="true">
        <span className="mdx-sprite-fallback-mark">?</span>
      </div>
    );
  }

  return (
    <img
      className={`mdx-sprite ${className}`}
      style={style}
      src={officialArtworkUrl(dex)}
      alt={name ? `${name} official artwork` : 'Pokemon official artwork'}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}
