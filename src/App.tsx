/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GraphPage } from './pages/GraphPage';
import { TopicNotesPage } from './pages/TopicNotesPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<GraphPage />} />
        <Route path="/topic/:id" element={<TopicNotesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
