import prisma from '../utils/prisma';

export const cleanupAnonymousUsers = async (): Promise<void> => {
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const deleted = await prisma.user.deleteMany({
    where: {
      authStatus: 'anonymous',
      createdAt: { lt: cutoffDate },
      conversations: { none: {} }, // no conversations
    },
  });

  console.log(`Deleted ${deleted.count} anonymous users`);
};

// For manual CLI run
if (require.main === module) {
  cleanupAnonymousUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Cleanup failed:', err);
      process.exit(1);
    });
}
