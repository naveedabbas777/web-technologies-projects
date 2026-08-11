import { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import db from '../firebase';
import useFirestoreDoc from '../hooks/useFirestoreDoc';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { normalizeImageUrl, getTextPreview } from '../utils';

function getItemLabel(sectionKey, item) {
  if (sectionKey === 'achievements') {
    return `${item.title || ''}${item.year ? ` — ${item.year}` : ''}`.trim();
  }

  return item.text || item.title || '';
}

function getItemDescription(sectionKey, item) {
  if (sectionKey === 'achievements') return 'Achievement record';
  if (sectionKey === 'awards') return 'Recognition and scholarship entry';
  if (sectionKey === 'education') return item.text || item.title || '';
  if (sectionKey === 'specialization') return item.text || item.title || '';
  return item.text || item.title || '';
}

function SectionPage({
  sectionKey,
  title,
  description,
  icon,
  collectionPath,
  emptyMessage,
  itemColor = 'var(--text-secondary)',
}) {
  const [expandedItemIds, setExpandedItemIds] = useState({});
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const { data: items = [] } = useFirestoreCollection({
    db,
    collectionPath,
    orderField: 'order',
    defaultValue: [],
  });

  const showOnSite = sectionVisibility?.[sectionKey]?.showOnSite ?? true;

  return (
    <Container fluid className="section-page py-5 px-4 px-md-5" style={{ minHeight: 'calc(100vh - var(--nav-height) - 180px)' }}>
      <div className="mb-4 fade-in">
        <h2
          className="mb-3"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {icon ? `${icon} ` : ''}{title}
        </h2>
        <p className="lead">{description}</p>
      </div>

      {!showOnSite ? (
        <div className="glass text-center p-5 fade-in">
          <p className="mb-0 text-muted">This section is currently hidden.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass text-center p-5 fade-in">
          <p className="mb-0 text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <Row className="g-4 fade-in">
          {items.map((item) => {
            const itemText = item.description || item.details || item.text || '';
            const previewInfo = getTextPreview(itemText, 2);
            const previewText = previewInfo.preview;
            const isExpanded = expandedItemIds[item.id];

            return (
              <Col key={item.id} xs={12} md={6} lg={4}>
                <Card className="glass border-0 h-100 section-page-card">
                  <Card.Body>
                    <div className="d-flex align-items-start gap-3 section-page-item">
                      <div className="section-page-icon" style={{ color: itemColor, fontSize: '1.4rem', lineHeight: 1 }}>
                        {icon || '•'}
                      </div>
                      <div className="section-page-content">
                        <h3 className="h5 mb-2" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                          {getItemLabel(sectionKey, item)}
                        </h3>
                        {item.imageUrl ? (
                          <img
                            src={normalizeImageUrl(item.imageUrl)}
                            alt={item.title || item.text || 'item'}
                            className="img-fluid rounded mb-3 section-page-image"
                            style={{ maxHeight: 220, objectFit: 'cover' }}
                          />
                        ) : null}
                        {itemText ? (
                          <>
                            <p className="text-muted mb-2" style={{ whiteSpace: 'pre-line' }}>
                              {isExpanded ? itemText : previewText}
                            </p>
                            {previewInfo.isTruncated && (
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => setExpandedItemIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                style={{ padding: 0, border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                aria-expanded={isExpanded ? 'true' : 'false'}
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-muted mb-0">{getItemDescription(sectionKey, item)}</p>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}

export default SectionPage;
