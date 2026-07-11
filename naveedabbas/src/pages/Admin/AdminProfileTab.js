export default function AdminProfileTab({
  visibilityNode,
  profileName,
  setProfileName,
  profileBio,
  setProfileBio,
  saveProfileInfo,
  profileUrl,
  profileUrlInput,
  setProfileUrlInput,
  profileFile,
  setProfileFile,
  resumeFile,
  setResumeFile,
  resumeUrl,
  uploading,
  uploadProgress,
  previewError,
  setPreviewError,
  setProfileImage,
  removeProfileImage,
  uploadImage,
  normalizeImageUrl,
  status,
}) {
  const normalizedProfileUrlInput = normalizeImageUrl((profileUrlInput || '').trim());

  return (
    <div className="admin-tab-section admin-profile-tab">
      <h3>Site profile — name, intro & image</h3>
      {visibilityNode}

      <h4 style={{ marginTop: 0, marginBottom: 12 }}>Display name</h4>
      <input
        value={profileName || ''}
        placeholder="e.g., Naveed Abbas"
        onChange={(e) => setProfileName(e.target.value)}
      />

      <h4 style={{ marginTop: 12, marginBottom: 12 }}>Short intro</h4>
      <textarea
        value={profileBio || ''}
        placeholder="Short intro shown in hero section"
        onChange={(e) => setProfileBio(e.target.value)}
        rows={4}
        style={{ resize: 'vertical' }}
      />

      <button onClick={saveProfileInfo} className="btn" style={{ marginTop: 12 }}>
        Save name & intro
      </button>

      <hr style={{ margin: '18px 0' }} />

      <h3>Profile image (optional)</h3>
      <p style={{ marginBottom: 8 }}>
        Paste an external image URL or upload a file — saved to your Firebase Auth profile and site settings.
      </p>

      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={profileUrlInput || ''}
          placeholder="https://.../your-image.jpg"
          onChange={(e) => {
            setProfileUrlInput(e.target.value);
            setPreviewError(false);
          }}
        />
        <button onClick={setProfileImage} className="btn">
          Save image link
        </button>
        <button onClick={removeProfileImage} className="btn secondary">
          Remove image link
        </button>
      </div>

      <div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.18)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
        <div><strong>Debug:</strong></div>
        <div>Input URL: {profileUrlInput || '(empty)'}</div>
        <div>Normalized URL: {normalizedProfileUrlInput || '(invalid/empty)'}</div>
        <div>Saved URL (Firestore profile.imageUrl): {profileUrl || '(empty)'}</div>
        <div>Last status: {status || '(none)'}</div>
      </div>

      {(profileUrlInput || profileUrl) && (
        <div style={{ marginTop: 8 }}>
          <img
            src={normalizeImageUrl((profileUrlInput || profileUrl || '').trim())}
            alt="preview"
            onError={() => setPreviewError(true)}
            onLoad={() => setPreviewError(false)}
            style={{
              width: 96,
              height: 96,
              objectFit: 'contain',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          {previewError && (
            <p style={{ color: '#fca5a5', marginTop: 8 }}>
              Preview failed — URL not a direct image or access-restricted. Use Storage upload instead.
            </p>
          )}
        </div>
      )}

      <div className="admin-inline-row" style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files[0])} />
        <button
          className="btn"
          onClick={() => uploadImage(profileFile, 'profile')}
          disabled={!profileFile || uploading}
        >
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload profile file'}
        </button>
      </div>

      <hr style={{ margin: '18px 0' }} />

      <h4>Resume (PDF)</h4>
      <p className="lead">Upload your PDF resume and it will replace the site resume download link.</p>
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
        <button
          className="btn"
          onClick={() => uploadImage(resumeFile, 'resume')}
          disabled={!resumeFile || uploading}
        >
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload resume (PDF)'}
        </button>
        {resumeUrl && (
          <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn secondary" style={{ marginLeft: 8 }}>
            View current resume
          </a>
        )}
      </div>
    </div>
  );
}
