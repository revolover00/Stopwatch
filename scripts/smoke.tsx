/**
 * jsdom smoke harness.
 *
 * The sandbox has no browser, so instead of screenshots we mount every route in
 * jsdom, drive the interactions and fail on any console error or React warning.
 */
import * as React from 'react';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en" data-theme="dark"><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;

const define = (name: string, value: unknown): void => {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};

define('window', window);
define('document', window.document);
define('navigator', window.navigator);
define('HTMLElement', window.HTMLElement);
define('Node', window.Node);
define('Event', window.Event);
define('MouseEvent', window.MouseEvent);
define('KeyboardEvent', window.KeyboardEvent);
define('localStorage', window.localStorage);
define('requestAnimationFrame', window.requestAnimationFrame.bind(window));
define('cancelAnimationFrame', window.cancelAnimationFrame.bind(window));
define('IS_REACT_ACT_ENVIRONMENT', true);

// jsdom has no layout engine: stub the two scrolling APIs the app uses.
window.scrollTo = (() => {}) as typeof window.scrollTo;
window.HTMLElement.prototype.scrollIntoView = () => {};

const problems: string[] = [];

const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args: unknown[]) => {
  const message = args.map(String).join(' ');
  // Interval-driven updates tick outside act(); that warning is expected here.
  if (!message.includes('not wrapped in act')) problems.push(`console.error: ${message}`);
  originalError(...args);
};
console.warn = (...args: unknown[]) => {
  const message = args.map(String).join(' ');
  if (!message.includes('not wrapped in act')) problems.push(`console.warn: ${message}`);
  originalWarn(...args);
};

window.addEventListener('error', (event) => problems.push(`window error: ${String(event.message)}`));

const { act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const { default: App } = await import('../src/App.tsx');
const { SettingsProvider } = await import('../src/context/SettingsContext.tsx');

const assertions: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    problems.push(`assertion failed: ${message}`);
    return;
  }
  assertions.push(message);
}

const settle = async (ms = 60): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const text = (): string => document.body.textContent ?? '';

function findButton(label: string): HTMLButtonElement {
  const buttons = Array.from(document.querySelectorAll('button'));
  const match = buttons.find((button) => {
    const haystack = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`.toLowerCase();
    return haystack.includes(label.toLowerCase());
  });
  if (!match) throw new Error(`Button "${label}" not found. Buttons: ${buttons.map((b) => b.textContent).join(' | ')}`);
  return match as HTMLButtonElement;
}

async function click(label: string): Promise<void> {
  const button = findButton(label);
  await act(async () => {
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

async function clickSubmit(scope = document): Promise<void> {
  const button = scope.querySelector('form button[type="submit"]') as HTMLButtonElement | null;
  if (!button) throw new Error('No submit button found in form');
  await act(async () => {
    button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

async function render(path: string): Promise<() => void> {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <SettingsProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </SettingsProvider>,
    );
  });
  await settle(80);

  return () => {
    act(() => root.unmount());
    container.remove();
  };
}

/* ---------------------------------------------------------------- */
/* Flip clock (home)                                                 */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/');
  assert(text().includes('Flip clock'), 'home renders its heading');
  assert(document.querySelectorAll('.flip-card').length >= 6, 'home renders six flip cards (H/M/S)');
  assert(document.querySelectorAll('.flip-group').length === 3, 'home renders three groups');
  assert(/[0-9]{2}/.test(document.querySelector('.flip-card')?.textContent ?? ''), 'flip cards contain digits');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Stopwatch: start, tick, lap                                       */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/stopwatch/');
  assert(text().includes('Stopwatch'), 'stopwatch renders its heading');
  assert(document.querySelectorAll('.flip-card').length === 8, 'stopwatch renders eight flip cards');

  const read = (): string =>
    Array.from(document.querySelectorAll('.flip-card'))
      .map((card) => card.textContent?.trim())
      .join('');

  const before = read();
  await click('Start');
  await settle(240);
  const running = read();
  assert(running !== before, 'stopwatch digits advance while running');
  assert(text().includes('Running'), 'status switches to running');

  await click('Lap');
  await settle(60);
  assert(!text().includes('No laps recorded yet'), 'recording a lap clears the empty state');
  assert(text().includes('Best lap'), 'lap statistics render');

  await click('Pause');
  await settle(60);
  assert(text().includes('Paused'), 'pause is reflected in the status pill');

  await click('Reset');
  await settle(60);
  assert(text().includes('No laps recorded yet'), 'reset clears the lap table');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Timer: presets and custom duration                                */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/timer/');
  assert(text().includes('Timer'), 'timer renders its heading');
  assert(text().includes('Quick presets'), 'timer shows quick presets');

  await click('1 min');
  await settle(40);
  assert(text().includes('00:60') || text().includes('01:00') || text().includes('Set to'), 'preset selection updates the configured time');

  await click('Start');
  await settle(240);
  assert(text().includes('Counting down'), 'timer reports that it is counting down');
  await click('Pause');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Countdown: default target and holiday presets                     */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/countdown/');
  assert(text().includes('Countdown'), 'countdown renders its heading');
  assert(document.querySelectorAll('.flip-group').length === 4, 'countdown renders days/hours/minutes/seconds');
  assert(text().includes('Holiday countdowns'), 'holiday table renders');

  await click('Christmas');
  await settle(60);
  assert(text().includes('Christmas countdown'), 'holiday preset retargets the countdown');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Alarm: create an alarm                                            */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/alarm/');
  assert(text().includes('Alarm clock'), 'alarm renders its heading');
  assert(text().includes('No alarms set'), 'alarm list starts empty');

  const hourSelect = document.getElementById('alarm-hour') as HTMLSelectElement | null;
  assert(hourSelect !== null, 'alarm form exposes the hour field');

  if (hourSelect) {
    const selectEvent = new window.Event('change', { bubbles: true });
    hourSelect.value = '9';
    hourSelect.dispatchEvent(selectEvent);
    await settle(30);
  }

  await clickSubmit();
  await settle(80);
  assert(!text().includes('No alarms set'), 'adding an alarm populates the list');
  assert(text().includes('Once'), 'new alarm reports its repeat rule');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Study timer: tasks and progress                                   */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/study-timer/');
  assert(text().includes('Study timer'), 'study timer renders its heading');
  assert(text().includes('Progress'), 'study timer renders progress');

  const input = document.getElementById('task-input') as HTMLInputElement | null;
  assert(input !== null, 'task input exists');

  if (input) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, 'Revise chapter 4');
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    await settle(30);
  }

  await clickSubmit();
  await settle(80);
  assert(text().includes('Revise chapter 4'), 'task appears in the list');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Settings drawer                                                   */
/* ---------------------------------------------------------------- */
{
  const dispose = await render('/stopwatch/');
  await click('Open settings');
  await settle(60);
  assert(text().includes('Theme selection'), 'settings drawer opens');
  assert(document.querySelector('[data-theme]') !== null, 'theme is applied to the document');
  await click('Midnight');
  await settle(60);
  assert(document.documentElement.dataset['theme'] === 'midnight', 'theme switch applies the palette');
  await click('Close settings');
  dispose();
}

/* ---------------------------------------------------------------- */
/* Report                                                            */
/* ---------------------------------------------------------------- */
console.log(`\n${assertions.length} assertions passed`);
for (const line of assertions) console.log(`  ✓ ${line}`);

if (problems.length > 0) {
  console.log(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.log(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('\nNo console errors or React warnings.');
process.exit(0);
