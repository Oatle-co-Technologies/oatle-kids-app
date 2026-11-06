import { drawingToolArtwork } from "./drawingToolArtwork";

export function DrawingToolIcon({ tool }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"
    dangerouslySetInnerHTML={{ __html: drawingToolArtwork[tool] }} />;
}
