export const LOSANT_API_URL = process.env.LOSANT_API_URL;
export const LOSANT_API_TOKEN = 'fake-token-for-testing';
export const APP_ID = '5f1b6285032b36000627facf';
export const DEVICE_ID = '5f1b64164280e100067ef355';
export const DATA_TABLE_ID = '69f4aa778580ae423942cc8e';

export const getDataTableRowResponse = {
  query: {},
  limit: 1000,
  offset: 0,
  sortDirection: 'asc',
  sortColumn: 'id',
  items: [
    {
      str: 'foo',
      num: 1,
      updatedAt: '2026-05-01T13:30:20.948Z',
      createdAt: '2026-05-01T13:30:20.948Z',
      id: '69f4aaece4d2a52768933d03'
    },
    {
      str: 'bar',
      num: 2,
      updatedAt: '2026-05-01T13:30:29.640Z',
      createdAt: '2026-05-01T13:30:29.640Z',
      id: '69f4aaf58580ae423942cc8f'
    }
  ],
  count: 2,
  totalCount: 2,
  applicationId: '5f1b6285032b36000627facf',
  dataTableId: '69f4aa778580ae423942cc8e'
};

export const listDevicesResponse = {
  count: 25,
  items: [
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef354',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: '4okrj1wi7hbi6uyyot6tq' }
      ],
      parentId: '5f1b64164280e100067ef353',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.324Z',
      lastUpdated: '2022-03-04T17:50:48.057Z',
      ancestorIds: [
        '5f1b64164280e100067ef28c',
        '5f1b64164280e100067ef34b',
        '6222516304375554a17dbe2a',
        '5f1b64164280e100067ef353'
      ],
      _etag: '"36b-XyLgP9YjiBaIJliL0nXAvFr7fXw"',
      deviceId: '5f1b64164280e100067ef355',
      id: '5f1b64164280e100067ef355',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef355`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef35c',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'dgevnum3jr80wxebot13ut' }
      ],
      parentId: '5f1b64164280e100067ef35b',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.332Z',
      lastUpdated: '2022-03-04T17:50:48.057Z',
      ancestorIds: [
        '5f1b64164280e100067ef28c',
        '5f1b64164280e100067ef35a',
        '6222516304375554a17dbe2a',
        '5f1b64164280e100067ef35b'
      ],
      _etag: '"36c-QhwUexXcDEQlr3aWkx5YAgKoSGQ"',
      deviceId: '5f1b64164280e100067ef35d',
      id: '5f1b64164280e100067ef35d',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef35d`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef364',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'z4a0c1oppy74sh69jok85' }
      ],
      parentId: '5f1b64164280e100067ef363',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.394Z',
      lastUpdated: '2022-03-04T17:50:48.057Z',
      ancestorIds: [
        '5f1b64164280e100067ef28c',
        '5f1b64164280e100067ef362',
        '6222516304375554a17dbe2a',
        '5f1b64164280e100067ef363'
      ],
      _etag: '"36b-b8O8r5Dh4dxa9w+oTMTSZcs/ndc"',
      deviceId: '5f1b64164280e100067ef365',
      id: '5f1b64164280e100067ef365',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef365`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef36c',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'bofua1n4xt4be1i2rh8unb' }
      ],
      parentId: '5f1b64164280e100067ef36b',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.415Z',
      lastUpdated: '2022-03-04T17:50:48.057Z',
      ancestorIds: [
        '5f1b64164280e100067ef28c',
        '5f1b64164280e100067ef36a',
        '6222516304375554a17dbe2a',
        '5f1b64164280e100067ef36b'
      ],
      _etag: '"36c-ndpaJOnbQGsClLKtQjHMQG3jgSg"',
      deviceId: '5f1b64164280e100067ef36d',
      id: '5f1b64164280e100067ef36d',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef36d`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef374',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'mekvf4h2wwhkq18onsjhvi' }
      ],
      parentId: '5f1b64164280e100067ef373',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.448Z',
      lastUpdated: '2022-03-04T17:50:48.057Z',
      ancestorIds: [
        '5f1b64164280e100067ef28c',
        '5f1b64164280e100067ef372',
        '6222516304375554a17dbe2a',
        '5f1b64164280e100067ef373'
      ],
      _etag: '"36c-anmN+1EiGHoUMYbr7gPmHisqN6I"',
      deviceId: '5f1b64164280e100067ef375',
      id: '5f1b64164280e100067ef375',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef375`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef37d',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'dztxa6fg6cbalrlo1d735s' }
      ],
      parentId: '5f1b64164280e100067ef37c',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.496Z',
      lastUpdated: '2020-07-24T22:49:59.785Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef37b',
        '5f1b64164280e100067ef37c'
      ],
      _etag: '"351-r/w/wKss9bHRMft0kcKeU51uLtA"',
      deviceId: '5f1b64164280e100067ef37e',
      id: '5f1b64164280e100067ef37e',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef37e`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef385',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'cftu1npj6hfy3tf9730l8' }
      ],
      parentId: '5f1b64164280e100067ef384',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.497Z',
      lastUpdated: '2020-07-24T22:49:59.805Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef383',
        '5f1b64164280e100067ef384'
      ],
      _etag: '"350-fDyFvkt4A06DvA6tC4wR9DOP/7Q"',
      deviceId: '5f1b64164280e100067ef386',
      id: '5f1b64164280e100067ef386',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef386`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef38d',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'z4lddk4kw8px27qegn8io9' }
      ],
      parentId: '5f1b64164280e100067ef38c',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.515Z',
      lastUpdated: '2020-07-24T22:49:59.811Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef38b',
        '5f1b64164280e100067ef38c'
      ],
      _etag: '"351-PQl1H7uzWJrU1OwGbAIx3hVmi94"',
      deviceId: '5f1b64164280e100067ef38e',
      id: '5f1b64164280e100067ef38e',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef38e`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef395',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'o7nkkn4co9awx8klgmape' }
      ],
      parentId: '5f1b64164280e100067ef394',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.537Z',
      lastUpdated: '2020-07-24T22:49:59.815Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef393',
        '5f1b64164280e100067ef394'
      ],
      _etag: '"350-uS11yx1F7npKEB1HfTClg/tMogY"',
      deviceId: '5f1b64164280e100067ef396',
      id: '5f1b64164280e100067ef396',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef396`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef39c',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: '7lu29ngqnv6iwkpcvvfah' }
      ],
      parentId: '5f1b64164280e100067ef39b',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.540Z',
      lastUpdated: '2020-07-24T22:49:59.820Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef393',
        '5f1b64164280e100067ef39b'
      ],
      _etag: '"350-ZBQdPJ2qBv+ATMhhRwt9BD181pc"',
      deviceId: '5f1b64164280e100067ef39d',
      id: '5f1b64164280e100067ef39d',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef39d`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3ac',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'yn3l0rsrzq9afmnn0lxq3c' }
      ],
      parentId: '5f1b64164280e100067ef3ab',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.566Z',
      lastUpdated: '2020-07-24T22:49:59.829Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3aa',
        '5f1b64164280e100067ef3ab'
      ],
      _etag: '"351-mWblwcZLURzJPATDltywdxiWwp0"',
      deviceId: '5f1b64164280e100067ef3ad',
      id: '5f1b64164280e100067ef3ad',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3ad`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3b4',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'ruehtuiyu4d6xy0wkagreo' }
      ],
      parentId: '5f1b64164280e100067ef3b3',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.589Z',
      lastUpdated: '2020-07-24T22:49:59.846Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3b2',
        '5f1b64164280e100067ef3b3'
      ],
      _etag: '"351-OD9mHzFMNkpm+hDOqzYZbHaP0/I"',
      deviceId: '5f1b64164280e100067ef3b5',
      id: '5f1b64164280e100067ef3b5',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3b5`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3a4',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'afnb0sqkrfnrtd7oofuv7s' }
      ],
      parentId: '5f1b64164280e100067ef3a3',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.549Z',
      lastUpdated: '2020-07-24T22:49:59.845Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3a2',
        '5f1b64164280e100067ef3a3'
      ],
      _etag: '"351-o4e7oF5w9ZGXHD4zxl3IP3HvqJc"',
      deviceId: '5f1b64164280e100067ef3a5',
      id: '5f1b64164280e100067ef3a5',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3a5`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3bc',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'kl3n8k4syji6kw2fbydom' }
      ],
      parentId: '5f1b64164280e100067ef3bb',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.595Z',
      lastUpdated: '2020-07-24T22:49:59.849Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3ba',
        '5f1b64164280e100067ef3bb'
      ],
      _etag: '"350-l0b/ph8Fhh+YB3jTIJBhGjnJUxI"',
      deviceId: '5f1b64164280e100067ef3bd',
      id: '5f1b64164280e100067ef3bd',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3bd`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3c3',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: '1xgv49btfjfj2rx87oc2dxb' }
      ],
      parentId: '5f1b64164280e100067ef3c2',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.686Z',
      lastUpdated: '2020-07-24T22:50:00.087Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3ba',
        '5f1b64164280e100067ef3c2'
      ],
      _etag: '"352-9IQPZeN9QT3UVb3EA4AuL1nu1do"',
      deviceId: '5f1b64164280e100067ef3c4',
      id: '5f1b64164280e100067ef3c4',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3c4`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3cb',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'f3k14j7ityo54q3uj781q' }
      ],
      parentId: '5f1b64164280e100067ef3ca',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.826Z',
      lastUpdated: '2020-07-24T22:50:00.400Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3c9',
        '5f1b64164280e100067ef3ca'
      ],
      _etag: '"350-p28Z+kIvwa52D35HCfi4RJsU3OM"',
      deviceId: '5f1b64164280e100067ef3cc',
      id: '5f1b64164280e100067ef3cc',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3cc`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3d3',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: '5plyou9czgm1n5ek8z0af' }
      ],
      parentId: '5f1b64164280e100067ef3d2',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.929Z',
      lastUpdated: '2020-07-24T22:50:00.431Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3d1',
        '5f1b64164280e100067ef3d2'
      ],
      _etag: '"350-fEaOyARdmnCC9BxEB8EgRMqvJbs"',
      deviceId: '5f1b64164280e100067ef3d4',
      id: '5f1b64164280e100067ef3d4',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3d4`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3db',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'ddwixwmdyh5a3cx0kujbf6' }
      ],
      parentId: '5f1b64164280e100067ef3da',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.937Z',
      lastUpdated: '2020-07-24T22:50:00.446Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3d9',
        '5f1b64164280e100067ef3da'
      ],
      _etag: '"351-wVezUXHaPtc9BPdB+YxCWP6eJGw"',
      deviceId: '5f1b64164280e100067ef3dc',
      id: '5f1b64164280e100067ef3dc',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3dc`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3eb',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'do2xg9rwb30rfneo2cy07c' }
      ],
      parentId: '5f1b64164280e100067ef3ea',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.979Z',
      lastUpdated: '2020-07-24T22:50:00.475Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3e9',
        '5f1b64164280e100067ef3ea'
      ],
      _etag: '"351-KC1ahV1IU/l/MlseF6o6TP7zqEw"',
      deviceId: '5f1b64164280e100067ef3ec',
      id: '5f1b64164280e100067ef3ec',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3ec`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3e3',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'iy4bve5k0yi3hm5s8zozyl' }
      ],
      parentId: '5f1b64164280e100067ef3e2',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.957Z',
      lastUpdated: '2020-07-24T22:50:00.478Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3e1',
        '5f1b64164280e100067ef3e2'
      ],
      _etag: '"351-Cci3W8BqnirGa2wx10nzPleU06g"',
      deviceId: '5f1b64164280e100067ef3e4',
      id: '5f1b64164280e100067ef3e4',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3e4`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3f2',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'yn8daudnlfr616ltubs7ks' }
      ],
      parentId: '5f1b64164280e100067ef3f1',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:49:59.986Z',
      lastUpdated: '2020-07-24T22:50:00.479Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3e9',
        '5f1b64164280e100067ef3f1'
      ],
      _etag: '"351-pslXxcxysQtQGL8NfMcGYnFNkRY"',
      deviceId: '5f1b64164280e100067ef3f3',
      id: '5f1b64164280e100067ef3f3',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3f3`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef401',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'a59epprmho57b3xk0ez7lv' }
      ],
      parentId: '5f1b64164280e100067ef400',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:50:00.048Z',
      lastUpdated: '2020-07-24T22:50:00.494Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3ff',
        '5f1b64164280e100067ef400'
      ],
      _etag: '"351-MNfIV8yPoym+Zx11qJzF1vcIPEg"',
      deviceId: '5f1b64164280e100067ef402',
      id: '5f1b64164280e100067ef402',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef402`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef3f9',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: '0uwvz8did84yedmo1kbz78' }
      ],
      parentId: '5f1b64164280e100067ef3f8',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:50:00.040Z',
      lastUpdated: '2020-07-24T22:50:00.497Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3e9',
        '5f1b64164280e100067ef3f8'
      ],
      _etag: '"351-2gluZA3AqJlXbayafPmmQZ2kCJ8"',
      deviceId: '5f1b64164280e100067ef3fa',
      id: '5f1b64164280e100067ef3fa',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef3fa`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef408',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'oxpg0otwzrojc5ejxcuze' }
      ],
      parentId: '5f1b64164280e100067ef407',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:50:00.068Z',
      lastUpdated: '2020-07-24T22:50:00.499Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3ff',
        '5f1b64164280e100067ef407'
      ],
      _etag: '"350-p2CP6o1KlqzyUgCIYAnWTz29bsQ"',
      deviceId: '5f1b64164280e100067ef409',
      id: '5f1b64164280e100067ef409',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: `/applications/${APP_ID}` },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef409`
        }
      }
    },
    {
      name: '2-Platen Electric Grill (ME-2P)',
      deviceClass: 'peripheral',
      gatewayId: '5f1b64164280e100067ef40f',
      attributes: [
        { attributeTags: {}, dataType: 'number', name: 'temperature' },
        { attributeTags: {}, dataType: 'string', name: 'error_code' },
        { attributeTags: {}, dataType: 'string', name: 'status' }
      ],
      tags: [
        { key: 'type', value: 'electric-grill' },
        { key: 'serial', value: 'ia9bhawxexk5op84svghok' }
      ],
      parentId: '5f1b64164280e100067ef40e',
      applicationId: APP_ID,
      creationDate: '2020-07-24T22:50:00.080Z',
      lastUpdated: '2020-07-24T22:50:00.513Z',
      ancestorIds: [
        '5f1b64164280e100067ef37a',
        '5f1b64164280e100067ef3ff',
        '5f1b64164280e100067ef40e'
      ],
      _etag: '"351-zkb2IPCYZLHlLZGOlEsJ4YOR89s"',
      deviceId: '5f1b64164280e100067ef410',
      id: '5f1b64164280e100067ef410',
      connectionInfo: { connected: null },
      _type: 'device',
      _links: {
        application: { href: '/applications/5f1b6285032b36000627facf' },
        devices: { href: `/applications/${APP_ID}/devices` },
        self: {
          href: `/applications/${APP_ID}/devices/5f1b64164280e100067ef410`
        }
      }
    }
  ],
  applicationId: APP_ID,
  perPage: 25,
  page: 1,
  sortField: 'name',
  sortDirection: 'asc',
  totalCount: 108520,
  _type: 'devices',
  _links: {
    application: { href: `/applications/${APP_ID}` },
    self: { href: `/applications/${APP_ID}/devices` }
  }
};
