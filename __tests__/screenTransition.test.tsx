/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { ScreenTransition } from '../src/components/ScreenTransition';

const render = (routeKey: string, label: string) => (
  <LanguageProvider>
    <ScreenTransition routeKey={routeKey} direction="forward">
      <Text>{label}</Text>
    </ScreenTransition>
  </LanguageProvider>
);

describe('ScreenTransition', () => {
  it('keeps the outgoing screen mounted while animating into a deep route', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(render('home', 'HOME'));
    });

    await ReactTestRenderer.act(async () => {
      tree!.update(render('service-details', 'DETAILS'));
    });

    // Both on screen at once is the whole point: one slides out as the other
    // slides in. Only the new one means the swap is still a hard cut.
    const output = JSON.stringify(tree!.toJSON());
    expect(output).toContain('DETAILS');
    expect(output).toContain('HOME');

    await ReactTestRenderer.act(async () => {
      tree!.unmount();
    });
  });

  it('swaps instantly between bottom-tab routes', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(render('home', 'HOME'));
    });

    await ReactTestRenderer.act(async () => {
      tree!.update(render('vendors', 'VENDORS'));
    });

    const output = JSON.stringify(tree!.toJSON());
    expect(output).toContain('VENDORS');
    expect(output).not.toContain('HOME');

    await ReactTestRenderer.act(async () => {
      tree!.unmount();
    });
  });
});
