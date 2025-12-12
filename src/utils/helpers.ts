const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const buildFileUrl = (path: string): string =>
  path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

export const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};
