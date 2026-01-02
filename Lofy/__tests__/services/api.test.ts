import * as SecureStore from 'expo-secure-store';
let api: typeof import('../../app/services/api').default;

describe('api client', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    jest.resetModules();
    // Re-require API after setting env so BASE_URL is resolved
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    api = require('../../app/services/api').default;
  });

  it('adds JSON headers and parses JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    const res = await api.get('/health');
    expect(res).toEqual({ ok: true });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:8000/health');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('handles non-JSON error responses gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });

    await expect(api.get('/oops')).rejects.toMatchObject({
      status: 500,
      message: 'Server error',
    });
  });

  it('maps AbortError to timeout message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });
    await expect(api.get('/slow')).rejects.toMatchObject({ message: expect.stringContaining('Timeout') });
  });

  it('POST JSON sends body and parses JSON', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-123');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ created: true }),
    });
    const res = await api.post('/items', { name: 'A' }, { timeout: 50 });
    expect(res).toEqual({ created: true });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:8000/items');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'A' });
  });

  it('POST FormData path skips JSON header', async () => {
    // Simulate global FormData environment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).FormData = class FormData {};
    const fd = new (global as any).FormData();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ uploaded: true }),
    });
    const res = await api.post('/upload', fd, { timeout: 50, isFormData: undefined });
    expect(res).toEqual({ uploaded: true });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.method).toBe('POST');
  });

  it('POST with isFormData=true skips JSON header even for object body', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ uploaded: true }),
    });
    const res = await api.post('/upload2', { foo: 'bar' }, { timeout: 50, isFormData: true });
    expect(res).toEqual({ uploaded: true });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.method).toBe('POST');
    expect(init.body).toEqual({ foo: 'bar' });
  });

  it('DELETE without body sends undefined body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ deleted: true }),
    });
    const res = await api.delete('/items/2', undefined);
    expect(res).toEqual({ deleted: true });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('handles JSON error body when response not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ detail: 'Bad request' }),
    });
    await expect(api.get('/bad')).rejects.toMatchObject({ status: 400, message: 'Bad request' });
  });

  it('PATCH JSON sends body and parses JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ updated: true }),
    });
    const res = await api.patch('/items/1', { name: 'B' }, { timeout: 50 });
    expect(res).toEqual({ updated: true });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:8000/items/1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'B' });
  });

  it('DELETE sends JSON body and parses JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ deleted: true }),
    });
    const res = await api.delete('/items/1', { reason: 'nope' });
    expect(res).toEqual({ deleted: true });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:8000/items/1');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ reason: 'nope' });
  });

  it('POST maps AbortError to friendly timeout message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });
    await expect(api.post('/slow', { x: 1 }, { timeout: 10 })).rejects.toMatchObject({
      message: expect.stringContaining('Timeout'),
    });
  });

  it('PATCH maps AbortError to friendly timeout message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });
    await expect(api.patch('/slow', { x: 1 }, { timeout: 10 })).rejects.toMatchObject({
      message: expect.stringContaining('Timeout'),
    });
  });

  it('DELETE maps AbortError to friendly timeout message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });
    await expect(api.delete('/slow', { reason: 'x' })).rejects.toMatchObject({
      message: expect.stringContaining('Timeout'),
    });
  });

  it('PATCH rethrows non-AbortError network issues', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    await expect(api.patch('/err', { y: 2 }, { timeout: 10 })).rejects.toThrow('network down');
  });
});
