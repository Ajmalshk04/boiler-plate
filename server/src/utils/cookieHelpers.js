const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  signed: true,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  signed: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

exports.setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('_nw_t', accessToken, accessTokenCookieOptions);
  res.cookie('_nw_rt', refreshToken, refreshTokenCookieOptions);
};

exports.clearTokenCookie = (res) => {
  res.cookie('_nw_t', '', {
    ...accessTokenCookieOptions,
    maxAge: 1
  });
  res.cookie('_nw_rt', '', {
    ...refreshTokenCookieOptions,
    maxAge: 1
  });
};

exports.setCRMAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('c_nw_t', accessToken, accessTokenCookieOptions);
  res.cookie('c_nw_rt', refreshToken, refreshTokenCookieOptions);
};

exports.clearCRMTokenCookie = (res) => {
  res.cookie('c_nw_t', '', {
    ...accessTokenCookieOptions,
    maxAge: 1
  });
  res.cookie('c_nw_rt', '', {
    ...refreshTokenCookieOptions,
    maxAge: 1
  });
};

module.exports = { 
  accessTokenCookieOptions, 
  refreshTokenCookieOptions,
  setAuthCookies: exports.setAuthCookies,
  clearTokenCookie: exports.clearTokenCookie,
  setCRMAuthCookies: exports.setCRMAuthCookies,
  clearCRMTokenCookie: exports.clearCRMTokenCookie
};