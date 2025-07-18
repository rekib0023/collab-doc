export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Document {
  id: string;
  name: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  creator: UserBasicInfo;
  description?: string;
  content?: any;
}
