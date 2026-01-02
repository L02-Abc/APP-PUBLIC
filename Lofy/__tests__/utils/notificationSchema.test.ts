import { NotificationListSchema } from '../../schema/notification';

describe('Notification schema', () => {
  it('parses valid list', () => {
    const input = [
      {
        id: 1,
        title: 'Ping',
        noti_message: 'You have a new message',
        time_created: new Date().toISOString(),
        is_read: false,
        link_to_newpost: null,
        user: { alias: 'thinh' },
      },
    ];
    const parsed = NotificationListSchema.parse(input);
    expect(parsed[0].title).toBe('Ping');
  });

  it('rejects invalid shape', () => {
    const bad = [{ id: 123 }] as unknown as Parameters<typeof NotificationListSchema.parse>[0];
    expect(() => NotificationListSchema.parse(bad)).toThrow();
  });
});
