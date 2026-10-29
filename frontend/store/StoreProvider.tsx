'use client';

import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './index';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // Store instance remains persistent across renders
  return <Provider store={store}>{children}</Provider>;
}
