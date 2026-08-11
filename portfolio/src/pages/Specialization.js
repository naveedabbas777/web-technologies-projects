import SectionPage from '../components/SectionPage';

export default function Specialization() {
  return (
    <SectionPage
      sectionKey="specialization"
      title="Specialization"
      icon="▸"
      description="The focus areas I work in most often."
      collectionPath="specialization"
      emptyMessage="No specialization items yet."
      itemColor="var(--primary)"
    />
  );
}
