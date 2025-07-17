import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './index';

export interface ApiError {
  status: number;
  data: {
    detail: string;
  };
}

// Define our API base service
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Get token from the store
      const token = (getState() as RootState).user.currentUser?.id;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ['User', 'Workspace', 'Document'],
  endpoints: () => ({}),
});

// Auth endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { token: string; user: any },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<
      { token: string; user: any },
      { email: string; password: string; name: string }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query<any, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
  }),
});

// Workspace endpoints
export const workspaceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<any[], void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),
    getWorkspaceById: builder.query<any, string>({
      query: (id) => `/workspaces/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Workspace', id }],
    }),
    createWorkspace: builder.mutation<
      any,
      { name: string; description?: string; is_private: boolean }
    >({
      query: (workspace) => ({
        url: '/workspaces',
        method: 'POST',
        body: workspace,
      }),
      invalidatesTags: ['Workspace'],
    }),
    updateWorkspace: builder.mutation<
      any,
      { id: string; name?: string; description?: string; is_private?: boolean }
    >({
      query: ({ id, ...workspace }) => ({
        url: `/workspaces/${id}`,
        method: 'PATCH',
        body: workspace,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Workspace', id },
        'Workspace',
      ],
    }),
    deleteWorkspace: builder.mutation<void, string>({
      query: (id) => ({
        url: `/workspaces/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workspace'],
    }),
    addWorkspaceMember: builder.mutation<
      any,
      { workspaceId: string; email: string; role: string }
    >({
      query: ({ workspaceId, ...data }) => ({
        url: `/workspaces/${workspaceId}/members`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: 'Workspace', id: workspaceId },
      ],
    }),
    updateWorkspaceMember: builder.mutation<
      any,
      { workspaceId: string; userId: string; role: string }
    >({
      query: ({ workspaceId, userId, ...data }) => ({
        url: `/workspaces/${workspaceId}/members/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: 'Workspace', id: workspaceId },
      ],
    }),
    removeWorkspaceMember: builder.mutation<
      void,
      { workspaceId: string; userId: string }
    >({
      query: ({ workspaceId, userId }) => ({
        url: `/workspaces/${workspaceId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: 'Workspace', id: workspaceId },
      ],
    }),
  }),
});

// Document endpoints
export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<any[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/documents`,
      providesTags: ['Document'],
    }),
    getDocument: builder.query<any, { workspaceId: string; documentId: string }>({
      query: ({ workspaceId, documentId }) =>
        `/workspaces/${workspaceId}/documents/${documentId}`,
      providesTags: ['Document'],
    }),
    createDocument: builder.mutation<
      any,
      { workspaceId: string; name: string; content?: any }
    >({
      query: ({ workspaceId, ...data }) => ({
        url: `/workspaces/${workspaceId}/documents`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Document'],
    }),
    updateDocument: builder.mutation<
      any,
      { workspaceId: string; documentId: string; name?: string; content?: any }
    >({
      query: ({ workspaceId, documentId, ...data }) => ({
        url: `/workspaces/${workspaceId}/documents/${documentId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Document'],
    }),
    deleteDocument: builder.mutation<
      void,
      { workspaceId: string; documentId: string }
    >({
      query: ({ workspaceId, documentId }) => ({
        url: `/workspaces/${workspaceId}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
} = authApi;

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useAddWorkspaceMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
} = workspaceApi;

export const {
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} = documentApi;
