export const environment = {
  production: true,
  // Production backend URL is not defined yet. Configure before deployment.
  // Do not use the legacy Fake API URL.
  cultivatechBaseApi: '',

  sessionStorageKey: 'cultivatech_active_session',

  signInEndpoint: '/authentication/sign-in',
  signUpEndpoint: '/authentication/sign-up',
  rolesEndpoint: '/roles',
  usersEndpoint: '/users',
  profileEndpoint: '/profile',

  profilesEndpoint: '/profiles',
  fieldsEndpoint: '/fields',
  devicesEndpoint: '/devices',
  sensorReadingsEndpoint: '/sensor-readings',
  reportsEndpoint: '/reports',
  statisticsEndpoint: '/statistics',

  productsEndpoint: '/products',
  inventoriesEndpoint: '/inventories',
  ordersEndpoint: '/orders',

  notificationsEndpoint: '/notifications',
  notificationPreferencesEndpoint: '/notification_preferences',
  communityProfilesEndpoint: '/community-profiles',
  commentsEndpoint: '/comments'
};
