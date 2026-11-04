export default function WritingProfileReminder({ missing, onSettings }) {
  return <section className="writing-profile-reminder" aria-label="Personalised writing sentences">
    <h2>{missing.length ? 'Make the sentences about your child' : 'Ready for personalised sentences'}</h2>
    <p>{missing.length
      ? 'Before starting Sentence Writing, go to Settings and fill in your child’s details. We use them to complete their practice sentences.'
      : 'Your child’s details are ready for Sentence Writing. You can update them in Settings.'}</p>
    {missing.length > 0 && <p>Add or check: {missing.join(', ')}. Use a nickname rather than a full name.</p>}
    <button type="button" className="secondary-button" onClick={onSettings}>{missing.length ? 'Go to child settings' : 'Edit child details'}</button>
  </section>;
}
