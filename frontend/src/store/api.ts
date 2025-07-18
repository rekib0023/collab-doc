import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { RootState } from './index';
import { Document } from '@/types/document';

export interface ApiError {
  status: number;
  data: {
    detail: string;
  };
}

// Define axios instance
const axiosBaseQuery = ({ baseUrl }: { baseUrl: string } = { baseUrl: '' }): BaseQueryFn => async (
  args,
  { getState }
) => {
  const token = (getState() as RootState).auth.token;

  try {
    const result = await axios({
      url: baseUrl + (typeof args === 'string' ? args : args.url),
      method: typeof args === 'string' ? 'GET' : args.method,
      data: args.body,
      params: args.params,
      withCredentials: true,
      headers: {
        ...args.headers,
        ...(token && { Authorization: `Bearer ${token}` })
      },
    });

    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as any;
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message
      },
    };
  }
};

// Define our API base service
export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({
    baseUrl: 'http://localhost:8000/api/v1',
  }),
  tagTypes: ['User', 'Workspace', 'Document'],
  endpoints: () => ({}),
});

// Auth endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { access_token: string; token_type: string, user: any },
      { email: string; password: string }
    >({
      query: (credentials) => {
        const formData = new FormData();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        return {
          url: '/auth/login',
          method: 'POST',
          body: formData,
          headers: {
            // Remove Content-Type header to let axios set it correctly with boundary for FormData
          },
        };
      },
    }),
    register: builder.mutation<
      { access_token: string; token_type: string; user: any },
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
    getDocuments: builder.query<Document[], string>({
      query: (workspaceId: string) => {
        if (workspaceId === 'recent') {
          return { url: '/workspaces/recent/documents' };
        }
        return {
          url: '/documents',
          params: { workspace_id: workspaceId },
        };
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Document' as const, id })),
            { type: 'Document', id: 'LIST' },
          ]
          : [{ type: 'Document', id: 'LIST' }],
    }),
    getDocument: builder.query<any, { documentId: string }>({
      query: ({ documentId }) => `/documents/${documentId}`,
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
      invalidatesTags: [{ type: 'Document', id: 'LIST' }],
    }),
    updateDocument: builder.mutation<
      any,
      { documentId: string; name?: string; content?: any }
    >({
      query: ({ documentId, ...data }) => ({
        url: `/documents/${documentId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Document'],
    }),
    deleteDocument: builder.mutation<void, { documentId: string }>({
      query: ({ documentId }) => ({
        url: `/documents/${documentId}`,
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
