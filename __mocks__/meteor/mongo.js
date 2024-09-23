export const Mongo = {
  Collection: jest.fn(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOneAsync: jest.fn(async () => Promise.resolve()),
    insertAsync: jest.fn(async () => Promise.resolve()),
    updateAsync: jest.fn(async () => Promise.resolve()),
    removeAsync: jest.fn(async () => Promise.resolve()),
  })),
};
