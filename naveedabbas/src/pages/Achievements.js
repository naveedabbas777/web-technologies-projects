import SectionPage from '../components/SectionPage';

export default function Achievements() {
  return (
    <SectionPage
      sectionKey="achievements"
      title="Achievements"
      icon="🏆"
      description="A dedicated page for achievements and milestones."
      collectionPath="achievements"
      emptyMessage="No achievements yet."
      itemColor="var(--accent-orange)"
    />
  );
}
