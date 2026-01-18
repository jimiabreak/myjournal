import { PrismaClient, Security, CommentState } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a user
  const user = await prisma.user.create({
    data: {
      username: 'jimi',
      email: 'jimi@example.com',
      passwordHash: '$2a$12$dummy.hash.for.seeding.purposes.only',
      displayName: 'Jimi Hendrix',
      bio: 'Purple haze all in my brain 🎸',
      userpicUrl: 'https://example.com/avatar.jpg',
    },
  });

  console.log('✅ Created user:', user.username);

  // Create 3 entries
  const entry1 = await prisma.entry.create({
    data: {
      userId: user.id,
      subject: 'My First Journal Entry',
      contentHtml: '<p>Just discovered this amazing platform! Can\'t wait to share my thoughts with the world. This is so much better than traditional websites.</p><p>The interface is clean and the community seems really welcoming. Looking forward to making some friends here!</p>',
      security: Security.PUBLIC,
      mood: 'excited',
      music: 'The Strokes - Last Nite',
      location: 'San Francisco, CA',
    },
  });

  const entry2 = await prisma.entry.create({
    data: {
      userId: user.id,
      subject: 'Coffee Shop Vibes ☕',
      contentHtml: '<p>Found this incredible little coffee shop downtown today. The atmosphere is perfect for writing and the barista actually knows how to make a proper cappuccino!</p><p>Sometimes it\'s the simple pleasures in life that make all the difference. Definitely going to be a regular here.</p>',
      security: Security.PUBLIC,
      mood: 'content',
      music: 'Norah Jones - Come Away With Me',
      location: 'Downtown Coffee Co.',
    },
  });

  const entry3 = await prisma.entry.create({
    data: {
      userId: user.id,
      subject: null, // Some entries don't have subjects
      contentHtml: '<p>Sometimes I wonder what the future of the internet will look like. Will we still be blogging in 10 years? Will people still care about personal websites and authentic sharing?</p><p>I hope so. There\'s something special about having your own little corner of the web.</p>',
      security: Security.FRIENDS,
      mood: 'contemplative',
      music: null,
      location: null,
    },
  });

  console.log('✅ Created entries:', [entry1.id, entry2.id, entry3.id]);

  // Create a threaded comment tree on the first entry
  const comment1 = await prisma.comment.create({
    data: {
      entryId: entry1.id,
      authorId: null, // Anonymous comment
      authorName: 'music_lover',
      contentHtml: '<p>Welcome to MyJournal! 🎉 You\'re going to love it here. The community is amazing and there\'s always interesting stuff to read.</p>',
      state: CommentState.VISIBLE,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      entryId: entry1.id,
      authorId: user.id,
      contentHtml: '<p>Thanks for the warm welcome! Already feeling at home here. Can\'t wait to explore more journals.</p>',
      parentId: comment1.id, // Reply to comment1
      state: CommentState.VISIBLE,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      entryId: entry1.id,
      authorId: null,
      authorName: 'bookworm23',
      contentHtml: '<p>@jimi I see you\'re into The Strokes! Have you heard their new stuff? It\'s incredible.</p>',
      parentId: comment1.id, // Also reply to comment1
      state: CommentState.VISIBLE,
    },
  });

  const comment4 = await prisma.comment.create({
    data: {
      entryId: entry1.id,
      authorId: user.id,
      contentHtml: '<p>@bookworm23 Yes! Their sound keeps evolving but they never lose that distinctive edge. Julian\'s vocals are timeless.</p>',
      parentId: comment3.id, // Reply to comment3
      state: CommentState.VISIBLE,
    },
  });

  // Add one more comment on the coffee shop entry
  const comment5 = await prisma.comment.create({
    data: {
      entryId: entry2.id,
      authorId: null,
      authorName: 'coffee_addict',
      contentHtml: '<p>Ooh, which coffee shop? I\'m always looking for new places to try! The coffee scene downtown has really improved lately.</p>',
      state: CommentState.VISIBLE,
    },
  });

  console.log('✅ Created comments:', [comment1.id, comment2.id, comment3.id, comment4.id, comment5.id]);

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });