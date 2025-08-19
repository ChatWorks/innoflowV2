import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const DocumentTitleUpdater: React.FC = () => {
  useDocumentTitle();
  return null; // This component doesn't render anything
};

export default DocumentTitleUpdater;