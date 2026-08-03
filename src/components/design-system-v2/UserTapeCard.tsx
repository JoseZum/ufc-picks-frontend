'use client';

/**
 * The public profile as a dialog.
 *
 * It holds the WHOLE profile and scrolls — there is no "view full profile"
 * link, because there is nothing else to see. `/users/[userId]` renders the
 * identical component for anyone who arrives by URL.
 *
 * Built on the same Radix Dialog the mission drawer uses, so focus trapping,
 * Escape and the overlay behave identically to the rest of the product.
 */

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { UserTapeProfile, useUserTapeData } from './UserTapeProfile';
import './user-tape-card.css';

interface Props {
  userId: string | null;
  onClose: () => void;
}

function Body({ userId }: { userId: string }) {
  const { isPending } = useUserTapeData(userId);

  if (isPending) {
    return (
      <div className="utc-loading">
        <Loader2 className="utc-spin" size={22} />
      </div>
    );
  }

  return (
    <UserTapeProfile
      userId={userId}
      renderName={(name) => (
        <DialogPrimitive.Title className="utc-name">{name}</DialogPrimitive.Title>
      )}
    />
  );
}

export function UserTapeCard({ userId, onClose }: Props) {
  if (!userId) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="utc-overlay" />
        <DialogPrimitive.Content className="utc-card" aria-describedby={undefined}>
          {/* Fuera del área con scroll: CLOSE sigue a la vista por largo que
              sea el perfil. */}
          <div className="utc-bar">
            <DialogPrimitive.Close className="utc-close">CLOSE</DialogPrimitive.Close>
          </div>
          <div className="utc-scroll">
            <Body userId={userId} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
