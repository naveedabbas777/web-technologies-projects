import SectionPage from '../components/SectionPage';

export default function Education() {
  return (
    <SectionPage
      sectionKey="education"
      title="Education"
      icon="🎓"
      description="My education history on its own page."
      collectionPath="education"
      emptyMessage="No education items yet."
      itemColor="var(--secondary)"
    />
  );
}
