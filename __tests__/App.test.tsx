/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders without falling back to the error boundary', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  // async act so the effects App kicks off on mount (session restore, settings
  // fetch) settle inside the test rather than logging after teardown.
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  const root = tree!.toJSON();
  expect(root).toBeTruthy();

  // A crash during render is caught by ErrorBoundary, which renders its own
  // screen. Without this check the test passes on a completely broken app —
  // "it rendered something" is not the same as "it rendered the app".
  const rendered = JSON.stringify(root);
  expect(rendered).not.toContain('An unexpected error occurred');
  expect(rendered).not.toContain('حدث خطأ غير متوقع');

  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
});
