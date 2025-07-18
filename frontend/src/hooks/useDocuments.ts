import { Document } from '@/types/document';
import { useGetDocumentsQuery } from '@/store/api';
import useAuth from './useAuth';

/**
 * Custom hook to fetch and manage documents for a specific workspace or type
 * @param workspaceIdOrType - Workspace ID or 'recent' for recent documents
 */
export const useDocuments = (workspaceIdOrType: string) => {
  const { isAuthenticated } = useAuth();

  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useGetDocumentsQuery(workspaceIdOrType, {
    skip: !workspaceIdOrType || !isAuthenticated,
  });

  /**
   * Filter documents by a search term
   */
  const filterDocuments = (searchTerm: string): Document[] => {
    if (!documents) return [];
    if (!searchTerm) return documents;

    const lowerTerm = searchTerm.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(lowerTerm) ||
      (doc.description && doc.description.toLowerCase().includes(lowerTerm))
    );
  };

  /**
   * Sort documents by different criteria
   */
  const sortDocuments = (sortBy: 'created' | 'updated' | 'name', ascending = true): Document[] => {
    if (!documents) return [];

    const sorted = [...documents];
    const multiplier = ascending ? 1 : -1;

    return sorted.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'updated':
          return multiplier * (new Date(a.updated_at ?? a.created_at).getTime() - new Date(b.updated_at ?? b.created_at).getTime());
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  return {
    documents,
    isLoading,
    isError: !!error,
    error,
    refetch,
    filterDocuments,
    sortDocuments
  };
};

export default useDocuments;
