'use client';

import React from 'react';
import CommandPaletteModal from './CommandPaletteModal';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  return <CommandPaletteModal isOpen={isOpen} onClose={onClose} />;
};

export default GlobalSearchModal;
