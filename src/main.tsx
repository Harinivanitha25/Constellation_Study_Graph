import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign ResizeObserver notifications from canvas/editor layout calculations
const isResizeObserverError = (msg: unknown) => {
  const str = String(msg || '');
  return str.includes('ResizeObserver loop completed with undelivered notifications') ||
         str.includes('ResizeObserver loop limit exceeded');
};

window.addEventListener('error', (e) => {
  if (isResizeObserverError(e.message) || isResizeObserverError(e.error)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (isResizeObserverError(e.reason?.message) || isResizeObserverError(e.reason)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const originalError = console.error;
console.error = (...args: any[]) => {
  if (args.some((arg) => isResizeObserverError(arg?.message || arg))) {
    return;
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);
