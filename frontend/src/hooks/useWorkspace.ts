import { useGetWorkspaceByIdQuery } from '@/store/api';
import { useParams } from 'react-router-dom';
import useAuth from './useAuth';

/**
 * Custom hook to fetch and manage workspace data by ID from the URL params
 * Handles authentication checks and loading/error states
 */
export const useWorkspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated } = useAuth();

  const {
    data: workspace,
    isLoading,
    error,
    refetch
  } = useGetWorkspaceByIdQuery(workspaceId || '', {
    skip: !workspaceId || !isAuthenticated,
  });

  return {
    workspace,
    workspaceId,
    isLoading,
    error,
    refetch,
    isError: !!error,
  };
};

export default useWorkspace;
