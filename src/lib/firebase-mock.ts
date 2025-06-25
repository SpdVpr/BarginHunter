// Mock Firebase implementation for demo/development mode
// This allows the app to run without real Firebase credentials

interface MockTimestamp {
  toDate(): Date;
}

class MockFirestore {
  private data: Map<string, Map<string, any>> = new Map();

  collection(name: string) {
    if (!this.data.has(name)) {
      this.data.set(name, new Map());
    }

    return {
      doc: (id?: string) => {
        const docId = id || this.generateId();
        return {
          id: docId,
          set: async (data: any) => {
            this.data.get(name)!.set(docId, { ...data, id: docId });
            return { id: docId };
          },
          get: async () => {
            const docData = this.data.get(name)!.get(docId);
            return {
              exists: !!docData,
              data: () => docData,
              id: docId,
            };
          },
          update: async (updates: any) => {
            const existing = this.data.get(name)!.get(docId) || {};
            this.data.get(name)!.set(docId, { ...existing, ...updates });
          },
          delete: async () => {
            this.data.get(name)!.delete(docId);
          },
        };
      },
      add: async (data: any) => {
        const docId = this.generateId();
        const docData = { ...data, id: docId };
        this.data.get(name)!.set(docId, docData);
        return {
          id: docId,
          get: async () => ({
            exists: true,
            data: () => docData,
            id: docId,
          }),
          delete: async () => {
            this.data.get(name)!.delete(docId);
          },
        };
      },
      where: (field: string, operator: string, value: any) => ({
        limit: (limitCount: number) => ({
          get: async () => {
            const docs = Array.from(this.data.get(name)!.values())
              .filter(doc => {
                switch (operator) {
                  case '==':
                    return doc[field] === value;
                  case '>=':
                    return doc[field] >= value;
                  case '<=':
                    return doc[field] <= value;
                  default:
                    return true;
                }
              })
              .slice(0, limitCount);

            return {
              empty: docs.length === 0,
              docs: docs.map(doc => ({
                id: doc.id,
                data: () => doc,
                ref: {
                  update: async (updates: any) => {
                    const existing = this.data.get(name)!.get(doc.id) || {};
                    this.data.get(name)!.set(doc.id, { ...existing, ...updates });
                  },
                },
              })),
            };
          },
        }),
        orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
          limit: (limitCount: number) => ({
            get: async () => {
              const docs = Array.from(this.data.get(name)!.values())
                .filter(doc => {
                  switch (operator) {
                    case '==':
                      return doc[field] === value;
                    default:
                      return true;
                  }
                })
                .sort((a, b) => {
                  const aVal = a[field];
                  const bVal = b[field];
                  if (direction === 'desc') {
                    return bVal > aVal ? 1 : -1;
                  }
                  return aVal > bVal ? 1 : -1;
                })
                .slice(0, limitCount);

              return {
                empty: docs.length === 0,
                docs: docs.map(doc => ({
                  id: doc.id,
                  data: () => doc,
                })),
              };
            },
          }),
        }),
        get: async () => {
          const docs = Array.from(this.data.get(name)!.values())
            .filter(doc => {
              switch (operator) {
                case '==':
                  return doc[field] === value;
                default:
                  return true;
              }
            });

          return {
            empty: docs.length === 0,
            docs: docs.map(doc => ({
              id: doc.id,
              data: () => doc,
              ref: {
                update: async (updates: any) => {
                  const existing = this.data.get(name)!.get(doc.id) || {};
                  this.data.get(name)!.set(doc.id, { ...existing, ...updates });
                },
              },
            })),
          };
        },
      }),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

class MockAuth {
  // Mock auth methods if needed
}

// Mock Timestamp
export const Timestamp = {
  now: (): MockTimestamp => ({
    toDate: () => new Date(),
  }),
  fromDate: (date: Date): MockTimestamp => ({
    toDate: () => date,
  }),
};

// Export mock instances
export const db = new MockFirestore();
export const auth = new MockAuth();

// Mock collections
export const collections = {
  stores: 'stores',
  gameConfigs: 'gameConfigs',
  gameSessions: 'gameSessions',
  gameScores: 'gameScores',
  discountCodes: 'discountCodes',
  analytics: 'analytics',
  customers: 'customers',
} as const;

console.log('🔧 Using Mock Firebase for development/demo mode');
