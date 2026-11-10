export function canShareMedia(file, navigatorApi = navigator) {
  try { return Boolean(navigatorApi.share && navigatorApi.canShare?.({ files: [file] })); }
  catch { return false; }
}
export async function shareMedia(file, navigatorApi = navigator) {
  try {
    // Called directly from the final save button, after export preparation, so
    // mobile browsers still have the user gesture required by the share sheet.
    await navigatorApi.share({ files: [file] });
    return 'shared';
  } catch (error) {
    if (error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}
export function downloadMedia(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = file.name;
  try { document.body.appendChild(link); link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
}
