import React from 'react';
import { SupportOlaModal } from './SupportOlaModal';

interface DonationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Official Support & Donations Modal wrapper.
 * Connects directly to real database-managed methods and reporting.
 */
export const DonationsModal: React.FC<DonationsModalProps> = ({ isOpen, onClose }) => {
  return <SupportOlaModal isOpen={isOpen} onClose={onClose} />;
};

export default DonationsModal;
