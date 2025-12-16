export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface ImageItem {
  _id: string;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  mimeType: string;
  resolutionWidth?: number;
  resolutionHeight?: number;

  title?: string;
  description?: string;
  tags?: string[];
  sharePassword?: string;

  hash: string;
  viewCount: number;

  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}
