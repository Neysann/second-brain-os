'use client';

import React from 'react';
import { DynamicIsland } from '@/components/island/DynamicIsland';

export default function DynamicIslandPage() {
  return (
    <main className="w-screen h-screen bg-transparent overflow-hidden select-none">
      <DynamicIsland />
    </main>
  );
}

