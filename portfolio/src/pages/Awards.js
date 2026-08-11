import SectionPage from '../components/SectionPage';

export default function Awards() {
  return (
    <SectionPage
      sectionKey="awards"
      title="Scholarships & Awards"
      icon="⭐"
      description="Scholarships, awards, and recognition."
      collectionPath="awards"
      emptyMessage="No scholarships or awards yet."
      itemColor="var(--accent-purple)"
    />
  );
}
