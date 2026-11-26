export const environment = {
  production: false,
  cultivatechBaseApi: 'http://localhost:8181/api/v1',

  sessionStorageKey: 'cultivatech_active_session',

  signInEndpoint: '/authentication/sign-in',
  signUpEndpoint: '/authentication/sign-up',
  rolesEndpoint: '/roles',
  usersEndpoint: '/users',
  profileEndpoint: '/profile',

  profilesEndpoint: '/profiles',
  fieldsEndpoint: '/fields',
  devicesEndpoint: '/devices',
  sensorReadingsEndpoint: '/sensor_readings',
  reportsEndpoint: '/reports',
  harvestProjectionsEndpoint: '/harvest_projections',

  productsEndpoint: '/products',
  inventoriesEndpoint: '/inventories',
  ordersEndpoint: '/orders',

  notificationsEndpoint: '/notifications',
  notificationPreferencesEndpoint: '/notification_preferences',
  communityProfilesEndpoint: '/community_profiles',
  commentsEndpoint: '/comments'
};
