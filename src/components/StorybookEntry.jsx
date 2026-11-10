import { storybooks } from '../data/storybooks';
import './StorybookAdventure.css';

export default function StorybookEntry({ onClick }) {
  return (
    <button type="button" className="storybook-adventure-entry" onClick={onClick}>
      <span className="storybook-entry-covers" aria-hidden="true">
        {storybooks.map(book => <img key={book.id} src={book.cover} alt="" loading="eager" />)}
      </span>
      <strong>Storybook Adventure</strong>
      <span className="storybook-entry-link">Explore the bookshelf →</span>
    </button>
  );
}
