import { useGetWorkspacesQuery } from '@/store/api';
import useAuth from './useAuth';

/**
 * Custom hook to fetch and manage workspaces data
 * Handles authentication checks, loading/error states, and provides sorting functionality
 */
export const useWorkspaces = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: workspaces,
    isLoading,
    error,
    refetch
  } = useGetWorkspacesQuery(undefined, {
    skip: !isAuthenticated,
  });

  /**
   * Sort workspaces by different criteria
   */
  const sortWorkspaces = (sortBy: 'name' | 'created' | 'updated', ascending = true) => {
    if (!workspaces) return [];
    
    const sorted = [...workspaces];
    const multiplier = ascending ? 1 : -1;
    
    return sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'created':
          return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'updated':
          return multiplier * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        default:
          return 0;
      }
    });
  };

  return {
    workspaces,
    isLoading,
    isError: !!error,
    error,
    refetch,
    sortWorkspaces
  };
};

export default useWorkspaces;
