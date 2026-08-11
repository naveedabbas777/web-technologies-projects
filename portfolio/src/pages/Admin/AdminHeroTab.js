export default function AdminHeroTab({
  visibilityNode,
  heroUrl,
  setHeroUrl,
  heroFile,
  setHeroFile,
  uploading,
  uploadProgress,
  heroPreviewError,
  setHeroPreviewError,
  onSaveHero,
  uploadImage,
  normalizeImageUrl,
}) {
  return (
    <div className="admin-tab-section admin-hero-tab">
      <h3>Site hero image (visible to all users)</h3>
      {visibilityNode}
      <p style={{ marginBottom: 8 }}>
        Paste a public image URL or upload an image. The saved URL is displayed to every visitor.
      </p>

      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={heroUrl || ''}
          placeholder="https://.../your-hero.jpg"
          onChange={(e) => {
            setHeroUrl(e.target.value);
            setHeroPreviewError(false);
          }}
        />
        <button onClick={onSaveHero} className="btn">
          Set hero image
        </button>
      </div>

      {heroUrl && (
        <div style={{ marginTop: 8 }}>
          <img
            src={heroUrl}
            alt="hero preview"
            onError={() => setHeroPreviewError(true)}
            onLoad={() => setHeroPreviewError(false)}
            style={{
              width: 240,
              height: 120,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          {heroPreviewError && (
            <p style={{ color: '#fca5a5', marginTop: 8 }}>
              Preview failed — URL likely access-restricted. Use Storage upload instead.
            </p>
          )}
        </div>
      )}

      <div className="admin-inline-row" style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" onChange={(e) => setHeroFile(e.target.files[0])} />
        <button
          className="btn"
          onClick={() => uploadImage(heroFile, 'hero')}
          disabled={!heroFile || uploading}
        >
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload hero file'}
        </button>
      </div>
    </div>
  );
}
